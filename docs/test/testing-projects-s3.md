# Testing Projects

All the testing projects under example and the Bloom related tests have been moved to AWS S3 Bucket. The reasoning behind this solution is that several of the test projects are rather large files. Mostly the Bloom related testing projects. The bucket is sil-app-builders-pwa-test-files.

# Create new tests

- Download the projects that need to be changed and zip_projects.sh
- Unzip the project(s) that you wish to change into your ```App Builder/Scripture Apps/Projects``` directory
- Make your changes to the test projects
- Run ./zip_projects.sh (Note that this will zip all the projects in this directory for other options check below)

Options:

| Option             | Description                                 |
| ------------------ | ------------------------------------------- |
| `-p '<name>'`  | Will zip the named project instead of all projects|
| `--project '<name>'` | Will zip the named project instead of all the projects|
| `--dry-run`  | Simply shows if it would zip or skip a particular folder; it will give the filename of the new zip file or say why it would Scripture|

Note there is a zip_bloom_projects.sh file. It should be assumed as an old version, and not ready to be discarded just yet.
