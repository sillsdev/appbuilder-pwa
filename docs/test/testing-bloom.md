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
2. Ask which project to use
3. Download the project zip into `test_data/bloom/` and verify its size and SHA-1 hash. A
   valid zip that was downloaded before is reused. A zip that fails verification is deleted.
4. Run `npm run clean:all`, build the project's data files with Scripture App Builder, and
   run `npm run convert`
5. Run the unit tests and the bloom tests

The downloaded project replaces whatever is in `data/`, the same as `npm run extract:example`.

Options:

| Option             | Description                                 |
| ------------------ | ------------------------------------------- |
| `--project <name>` | Use the named project instead of asking     |
| `--list`           | List the available projects and exit        |
| `--bloom-only`     | Run only the bloom tests                    |
| `--index <url>`    | Use this `index.json` URL instead of `.env` |

Options are passed after `--`, for example
`npm run test:bloom -- --project my_project --bloom-only`.

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
