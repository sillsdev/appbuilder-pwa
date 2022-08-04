# appbuilder-pwa

A template for building a Progressive Web App with Scripture App Builder.

## Usage

You will need to have Scripture App Builder 10.0.1 or newer to use this project without the provided example data.

### Develop

Once you've installed dependencies with `npm install`, you will need to convert data from one of the data folders before you can start a development server.  
This can be accomplished in two ways:

-   Run `npm run convertExamples` in the console to use the example data folder.
-   Run `Build PWA Data Files` in Scripture App Builder.

> Contact [chris_hubbard@sil.org](mailto:chris_hubbard@sil.org) for the feature key to enable `Build PWA Data Files`

If you are using the example data, run `npx svelte-kit dev` to start a development server. Otherwise, `npm run dev` will automatically convert the files in the folder copied to by `Build PWA Data Files`.

> Note: The book conversion step can take up to several minutes depending on the amount of scripture in the project and the speed of your computer's hard drive.

### Build

Run `npm run build` to build an app with the data provided by `Build PWA Data Files`.

Run `npm run buildExamples` to build an app with the example data.

The production build can be viewed by running `npm run preview`.

### Deployment

This project is configured by default with the static adaptor, which will allow deployment on any platform that requires a static site.
