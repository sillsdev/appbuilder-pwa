# Bloom Tests

Bloom test projects are too large to keep in the git repo, so they are stored in an AWS bucket
and downloaded on demand. Bloom tests are not run by `npm run test` or by CI.

See [Vitest Basics](testing-basics.md) for general information about writing and running tests.

# Setup

Copy `.env.example` to `.env` and set `BLOOM_TEST_INDEX_URL` to the URL of the bucket's
`index.json`. Scripture App Builder must be installed, the same as for `npm run extract:example`.

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
| `--project <name>` | Use the named project instead of asking     |
| `--run-all`        | Run all projects instead of asking          |
| `--list`           | List the available projects and exit        |
| `--index <url>`    | Use this `index.json` URL instead of `.env` |

Options are passed after `--`, for example
`npm run test:bloom -- --project my_project`.

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

# Bloom Book Features

Each bloom book's `meta.json` has a `features` array. These are the values Bloom writes, and the
folders each feature may add to the book:

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
