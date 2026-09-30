# Bloom Tests

Bloom test projects are too large to keep in the git repo, so they are stored in an AWS bucket
and downloaded on demand. Bloom tests are not run by `npm run test` and currently not run by CI.

# Setup

Scripture App Builder must be installed, the same as for `npm run extract:example`.

# Running

```
npm run test:bloom
```

This will:

1. Download `index.json` and list the available projects
2. Ask which project to use, or whether to run all projects one after the other
3. Download the project zip into `test_data/bloom/` and verify its size and SHA-1 hash. A
   valid zip that was downloaded before is reused. A zip that fails verification is deleted.
4. Run `npm run clean:all`, build the project's data files with Scripture App Builder, and
   run `npm run convert`
5. Run the bloom tests

When running all projects, steps 3–5 repeat for each project and a summary of passed, failed and
skipped projects is printed at the end.

The downloaded project replaces whatever is in `data/`, the same as `npm run extract:example`.

Options:

| Option             | Description                                 |
| ------------------ | ------------------------------------------- |
| `--project "<name>"` | Use the named project instead of asking     |
| `--run-all`        | Run all projects instead of asking          |
| `--list`           | List the available projects and exit        |
| `--index <url>`    | Use this `index.json` URL instead of the included URL|

Options are passed after `--`, for example
`npm run test:bloom -- --project "my_project"`.

Once a bloom project has been converted into `data/`, the bloom tests can be rerun directly with
`npx vitest --project bloom`.

# index.json format

`index.json` is an array of projects:

```json
[
    {
        "name": "my_project",
        "description": "Short description shown in the list",
        "file": "my_project.zip",
        "size": "1.2 GB",
        "size_bytes": 1288490188,
        "sha1": "3f94dabaa10cbe7e3e3d3835683d09ffaf646052"
    }
]
```

`file` must be a plain zip file name stored next to `index.json` in the bucket. An optional
`program` field (default `sab`) selects the App Builder used to build the project. Only `sab` is
currently supported.

# Writing bloom tests

Name bloom test files `*.bloom.test.ts` and place them in `convert/tests/bloom/`. Files with this
suffix belong to the `bloom` Vitest project and are excluded from `npm run test`. Wrap tests in
`describe.skipIf(!isBloomProjectLoaded())` from `bloomTestUtils.ts` so they are skipped instead
of failing when `data/` does not contain a bloom project.

# Upload new test Bloom Books

Name each project with Bloom Project Name. This is convention allows the following script to quickly zip up the SAB projects with Bloom Book(s) and create the index.json file. Then upload them to the proper AWS bucket for downloading and testing when running `npm run test:bloom`.

```bash
#!/bin/bash
# Zips every project folder starting with "Bloom" (any capitalization), computes
# a SHA-1 hash of each zip, and writes an index.json manifest used to verify downloads.
#
# A project is only re-zipped when the contents of its files change. Each project's
# content fingerprint (a hash of every file path and file contents) is kept in
# <output_dir>/.fingerprints/, so files that are rewritten without changing, like
# SAB regenerating its tab icons, don't produce a new zip or a new SHA-1.
# Zips for projects that no longer exist are deleted.
# To force a full rebuild, delete the output folder first.
#
# Usage: ./zip_bloom_projects.sh [output_dir]   (default: ./bloom_zips)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="${1:-$SCRIPT_DIR/bloom_zips}"
MANIFEST="$OUT_DIR/index.json"
FP_DIR="$OUT_DIR/.fingerprints"

mkdir -p "$OUT_DIR" "$FP_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"
FP_DIR="$OUT_DIR/.fingerprints"
cd "$SCRIPT_DIR"

# Match Bloom*, bloom*, BLOOM*, etc.; no matches -> empty loop
shopt -s nocaseglob nullglob

entries=()
current_zips=()   # zip names for projects that still exist
zipped=0
unchanged=0

# Prints the text of the first <tag>...</tag> in a file, decoding basic XML entities
xml_tag() {
    sed -n "s:.*<$1>\(.*\)</$1>.*:\1:p" "$2" | head -n 1 \
        | sed -e 's/&lt;/</g' -e 's/&gt;/>/g' -e "s/&apos;/'/g" -e 's/&quot;/"/g' -e 's/&amp;/\&/g'
}

# Formats a byte count as KB, MB or GB (decimal units, matching Finder)
human_size() {
    awk -v b="$1" 'BEGIN {
        if (b >= 1e9)      printf "%.2f GB", b / 1e9
        else if (b >= 1e6) printf "%.2f MB", b / 1e6
        else               printf "%.2f KB", b / 1e3
    }'
}

# Prints a SHA-1 of every folder path, file path and file's contents in a project,
# skipping the same files the zip leaves out. File dates are not included.
fingerprint() {
    {
        find "$1" \( -name '.DS_Store' -o -name '__MACOSX' \) -prune -o -type d -print | sed 's/^/dir  /'
        find "$1" \( -name '.DS_Store' -o -name '__MACOSX' \) -prune -o -type f -print0 | xargs -0 shasum -a 1
    } | LC_ALL=C sort | shasum -a 1 | awk '{print $1}'
}

# True if a zip name belongs to a project that still exists
is_current() {
    local z
    for z in ${current_zips[@]+"${current_zips[@]}"}; do
        [[ "$z" == "$1" ]] && return 0
    done
    return 1
}

for dir in Bloom*/; do
    dir="${dir%/}"
    [[ "$SCRIPT_DIR/$dir" == "$OUT_DIR" ]] && continue   # don't zip our own output folder
    appdef="$dir/$dir.appDef"

    if [[ ! -f "$appdef" ]]; then
        echo "Skipping '$dir': $appdef not found" >&2
        continue
    fi

    name="$(xml_tag project-name "$appdef")"
    [[ -z "$name" ]] && name="$dir"
    description="$(xml_tag project-description "$appdef")"

    # Lowercase, spaces -> underscores
    zipname="$(echo "$dir" | tr '[:upper:]' '[:lower:]' | tr ' ' '_').zip"
    zippath="$OUT_DIR/$zipname"
    fpfile="$FP_DIR/$zipname.sha1"

    current_zips+=("$zipname")

    fp="$(fingerprint "$dir")"
    old_fp="$(cat "$fpfile" 2>/dev/null || true)"

    if [[ -f "$zippath" && "$fp" == "$old_fp" ]]; then
        echo "Unchanged '$dir'"
        unchanged=$((unchanged + 1))
    elif [[ -f "$zippath" && -z "$old_fp" && -z "$(find "$dir" -newer "$zippath" ! -name '.DS_Store' -print -quit)" ]]; then
        # No fingerprint yet (zip made by an older version of this script), but nothing
        # is newer than the zip, so keep it and start tracking its contents
        echo "Unchanged '$dir' (fingerprint recorded)"
        echo "$fp" > "$fpfile"
        unchanged=$((unchanged + 1))
    else
        echo "Zipping '$dir' -> $zipname"
        # Build in a temp file so a failed run never leaves a partial zip that looks current
        rm -f "$zippath.tmp"
        zip -r -q -X "$zippath.tmp" "$dir" -x '*.DS_Store' -x '*/__MACOSX/*'
        mv -f "$zippath.tmp" "$zippath"
        echo "$fp" > "$fpfile"
        zipped=$((zipped + 1))
    fi

    sha1="$(shasum -a 1 "$zippath" | awk '{print $1}')"
    size_bytes="$(stat -f %z "$zippath")"   # bytes (macOS stat)
    size="$(human_size "$size_bytes")"

    entries+=("$(jq -n --arg name "$name" --arg description "$description" \
        --arg file "$zipname" --arg size "$size" --argjson size_bytes "$size_bytes" --arg sha1 "$sha1" \
        '{name: $name, description: $description, file: $file, size: $size, size_bytes: $size_bytes, sha1: $sha1}')")
done

# Remove zips and fingerprints for projects that were deleted or renamed
removed=0
for old in "$OUT_DIR"/*.zip; do
    base="$(basename "$old")"
    if ! is_current "$base"; then
        echo "Removing stale '$base'"
        rm -f "$old"
        removed=$((removed + 1))
    fi
done
for old in "$FP_DIR"/*.zip.sha1; do
    is_current "$(basename "$old" .sha1)" || rm -f "$old"
done

if (( ${#entries[@]} == 0 )); then
    rm -f "$MANIFEST"
    echo "No Bloom projects found." >&2
    exit 1
fi

printf '%s\n' "${entries[@]}" | jq -s '.' > "$MANIFEST.tmp"
mv -f "$MANIFEST.tmp" "$MANIFEST"

echo "Zipped $zipped, unchanged $unchanged, removed $removed"
echo "Wrote ${#entries[@]} entries to $MANIFEST"
```

# Bloom Book Features

Each bloom book's `meta.json` has a `features` array. In writing new test cases you need to be aware of these meta data values. These are the values Bloom writes, and the
folders each feature may add to the bloom_tests:

| Feature             | Meaning                                          | Folder(s) it may add                                           |
| ------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `blind`             | Image descriptions for visually impaired readers | None for text-only descriptions, `audio/` if narrated          |
| `talkingBook`       | Recorded narration synced to the text            | `audio/`                                                       |
| `signLanguage`      | Sign language video                              | `video/`                                                       |
| `video`             | Contains video                                   | `video/`                                                       |
| `motion`            | Pan/zoom on images                               | None                                                           |
| `activity`          | Any game or activity (see below)                 | None of its own                                                |
| `quiz`              | Comprehension quiz                               | None                                                           |
| `widget`            | HTML5 widget (`.wdgt`)                           | `activities/<widget name>/`                                    |
| `simple-dom-choice` | Simple multiple-choice game                      | `audio/` for right/wrong sounds                                |
| `drag-game`         | Drag game, such as drag-image-to-target          | `audio/` for `data-correct-sound` and `data-wrong-sound` files |

`blind`, `talkingBook` and `signLanguage` also get a language-specific entry such as
`talkingBook:en` or `signLanguage:tza`, in addition to the plain name.

`activity` is not set on its own. Bloom adds it whenever `quiz`, `widget`, `simple-dom-choice` or
`drag-game` is set, so a book marked `activity` may not have an `activities/` folder. Only `widget`
means the book has an `activities/` folder.

`audio/` and `video/` can each come from more than one feature. Game images and icons are stored in
the book's root folder, and `questions.json` is present in the root even when the book has no quiz.

Older books may have been published before some of these features existed.

Sources:

- BloomDesktop
  [`BookInfo.cs` `Features`](https://github.com/BloomBooks/BloomDesktop/blob/d45e6810816c61761e80657d1ddc7f7e907b5446/src/BloomExe/Book/BookInfo.cs#L1617-L1703)
  writes the `features` array, and
  [`Feature_Activity`](https://github.com/BloomBooks/BloomDesktop/blob/d45e6810816c61761e80657d1ddc7f7e907b5446/src/BloomExe/Book/BookInfo.cs#L1740-L1748)
  derives `activity` from the game features
- BloomDesktop
  [`Book.cs` `UpdateMetadataFeatures`](https://github.com/BloomBooks/BloomDesktop/blob/d45e6810816c61761e80657d1ddc7f7e907b5446/src/BloomExe/Book/Book.cs#L5785-L5997)
  detects each feature in the book. `widget` is set when the book references an
  [`activities/` folder](https://github.com/BloomBooks/BloomDesktop/blob/d45e6810816c61761e80657d1ddc7f7e907b5446/src/BloomExe/Book/Book.cs#L5916-L5924)
- BloomDesktop folder names:
  [`activities/`](https://github.com/BloomBooks/BloomDesktop/blob/d45e6810816c61761e80657d1ddc7f7e907b5446/src/BloomExe/Book/BookStorage.cs#L4086-L4089),
  [`video/`](https://github.com/BloomBooks/BloomDesktop/blob/d45e6810816c61761e80657d1ddc7f7e907b5446/src/BloomExe/Book/BookStorage.cs#L1690-L1695)
  and
  [`audio/`](https://github.com/BloomBooks/BloomDesktop/blob/d45e6810816c61761e80657d1ddc7f7e907b5446/src/BloomExe/Publish/AudioProcessor.cs#L121-L124)
- bloom-player
  [`bookInfo.ts`](https://github.com/BloomBooks/bloom-player/blob/8f2a12705c1c8d03ea7a83b5141263586300a660/src/bookInfo.ts#L4-L9)
  reads `features` from `meta.json`, and
  [`guessFeatures`](https://github.com/BloomBooks/bloom-player/blob/8f2a12705c1c8d03ea7a83b5141263586300a660/src/bookInfo.ts#L200-L260)
  guesses them for old books that do not list them
