# Example Projects

Example projects used by `npm run extract:example` and CI are stored in an AWS bucket and
downloaded on demand.

# Running

```
npm run extract:example <project_name>
```

This will:

1. Download `index.json` from the bucket
2. Find `<project_name>.zip` in `index.json`
3. Download the zip into `test_data/projects/<program>/` and verify its size and SHA-1 hash. A
   valid zip that was downloaded before is reused. A zip that fails verification is deleted.
4. Build the project's data files with the App Builder for its program

Options:

| Option           | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| `--download-all` | Download and verify every project in `index.json` without building |
| `--index <url>`  | Use this `index.json` URL instead of the included URL           |

Options are passed after `--`, for example `npm run extract:example -- --download-all`.
`--download-all` can be combined with a project name to download everything and then build that
project.

# index.json format

One `index.json` at the root of the bucket lists the example projects and the
[bloom test projects](testing-bloom.md). The repo copy is `test_data/projects/index.json`. It is
an object keyed by program (`sab`, `dab`, `rab`). Each program has a `projects` list for
`npm run extract:example` and CI, and may have a `bloom` list for `npm run test:bloom`:

```json
{
    "sab": {
        "projects": [
            {
                "name": "WEB Gospels",
                "description": "",
                "file": "sab/web_gospels.zip",
                "size": "9.87 MB",
                "size_bytes": 9874965,
                "sha1": "3f94dabaa10cbe7e3e3d3835683d09ffaf646052",
                "tests": ["src/", "convert/tests/sab/"]
            }
        ],
        "bloom": [
            {
                "name": "Bloom Big Fish",
                "description": "Talking book. English is the only one of three languages that has audio.",
                "file": "sab/bloom_tests/bloom_big_fish.zip",
                "size": "3.86 MB",
                "size_bytes": 3863782,
                "sha1": "c21cd9116298ec5387becc4ea8a6513e8279658d",
                "tests": ["convert/tests/bloom/"]
            }
        ]
    }
}
```

Every entry in both lists has the same fields:

| Field         | Description                                                           |
| ------------- | --------------------------------------------------------------------- |
| `name`        | Project name from the `.appDef`. `test:bloom --project` matches this  |
| `description` | Project description from the `.appDef`. May be empty                  |
| `file`        | Path of the zip in the bucket, relative to `index.json`               |
| `size`        | Size shown to people, for example `3.86 MB`                           |
| `size_bytes`  | Exact size of the zip, used to verify the download                    |
| `sha1`        | SHA-1 of the zip, used to verify the download                         |
| `tests`       | Test folders to run for the project                                   |

`npm run extract:example <project_name>` matches `<project_name>.zip` against the last part of
`file`. Example zips are saved to `test_data/projects/<program>/` and bloom zips to
`test_data/bloom/`.
