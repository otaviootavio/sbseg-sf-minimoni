<div align="center">
<img src="public/icon-128.png" alt="logo"/>
<h1> Minimalist Chrome/Firefox Extension Boilerplate with<br/>React + Vite + TypeScript + TailwindCSS</h1>

<h5>
This template repository is a side product of my Chrome Extension <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/supatabs/icbcnjlaegndjabnjbaeihnnmidbfigk">Supatabs</a>.
<br />
If you tend to have tons of tabs open, or are a OneTab user, make sure to check it out <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/supatabs/icbcnjlaegndjabnjbaeihnnmidbfigk">here</a>!
</h5>

<h5>Supatabs is an example and showcase of what you can develop with this template. (anything you want, really 🚀)</h5>

</div>

## Table of Contents

- [Intro](#intro)
- [Features](#features)
- [Usage](#usage)
  - [Getting Started](#gettingStarted) 
  - [Customization](#customization)
  - [Publish](#publish)
- [Tech Docs](#tech)
- [Credit](#credit)
- [Contributing](#contributing)


## Intro <a name="intro"></a>
This boilerplate is meant to be a minimal quick start for creating chrome/firefox extensions using React, Typescript and Tailwind CSS.

It includes all possible pages such as **new tab**, **dev panel**, **pop up**, etc., as well as corresponding manifest settings by default.
You will likely have to customize/delete some of the pages (see docs below).

You can build dist files for both Chrome and Firefox with manifest v3.

If you are looking for a React focused way to access the local storage, I also implemented a chrome local/sync storage hook. The hook works
well with this template. [Check it out here](https://gist.github.com/JohnBra/c81451ea7bc9e77f8021beb4f198ab96).

## Features <a name="features"></a>
- [React 19](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [i18n (optional)](https://developer.chrome.com/docs/extensions/reference/api/i18n)
- [Cross browser development with polyfill (optional)](https://github.com/mozilla/webextension-polyfill?tab=readme-ov-file#basic-setup-with-module-bundlers)
- [ESLint](https://eslint.org/)
- [Chrome Extension Manifest Version 3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Github Action](https://github.com/JohnBra/vite-web-extension/actions/workflows/ci.yml) to build and zip your extension (manual trigger)

## Usage <a name="usage"></a>

### Getting Started <a name="gettingStarted"></a>

#### Developing and building
This template comes with build configs for both Chrome and Firefox. Running
`dev` or `build` commands without specifying the browser target will build
for Chrome by default.

1. Clone this repository or click "Use this template"
2. Change `name` and `description` in `manifest.json`
3. Run `yarn` or `npm i` (check your node version >= 16)
4. Run `yarn dev[:chrome|:firefox]`, or `npm run dev[:chrome|:firefox]`

Running a `dev` command will build your extension and watch for changes in the 
source files. Changing the source files will refresh the corresponding 
`dist_<chrome|firefox>` folder.

To create an optimized production build, run `yarn build[:chrome|:firefox]`, or
`npm run build[:chrome|:firefox]`.

#### Load your extension
For Chrome
1. Open - Chrome browser
2. Access - [chrome://extensions](chrome://extensions)
3. Tick - Developer mode
4. Find - Load unpacked extension
5. Select - `dist_chrome` folder in this project (after dev or build)

For Firefox
1. Open - Firefox browser
2. Access - [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
3. Click - Load temporary Add-on
4. Select - any file in `dist_firefox` folder (i.e. `manifest.json`) in this project (after dev or build)

### Customization <a name="customization"></a>

#### Adding / removing pages
The template includes source code for **all** of the extension pages (i.e. New Tab, Dev Tools, Popup, Side Panel
etc.). You will likely have to customize it to fit your needs.

E.g. you don't want the newtab page to activate whenever you open a new tab:
1. remove the directory `newtab` and its contents in `src/pages`
2. remove `chrome_url_overrides: { newtab: 'src/pages/newtab/index.html' },` in `manifest.json`

Some pages like the "Side Panel" don't work the exact same in Chrome and Firefox. While this template includes
the source code for the side panel, it won't automatically be included in the dist file to prevent cross browser
build warnings.

To include the side panel for Chrome add the following to the `manifest.json`:

```typescript
{
  "manifest_version": 3,
  // ...
  "permissions": [
    "activeTab",
    "sidePanel" // <-- permission for sidepanel
  ],
  // ...
  "side_panel": {
    "default_path": "src/pages/panel/index.html" // <-- tell vite to include it in the build files
  },
  // ...
}
```

If you need to declare pages in addition to the manifest pages, e.g. a custom `app` page, create a 
new folder in the `pages` directory and add the corresponding `.html`, `.tsx` and `.css` 
files (see `options/*` for an example to copy). Then include the root html in the `vite.config.base.ts` 
file under `build.rollupOptions.input` like so:

```typescript
// ...
build: {
   rollupOptions: {
      input: {
         app: resolve(pagesDir, "app", "index.html"),
      },
      output: {
         entryFileNames: (chunk) => `src/pages/${chunk.name}/index.js`,
      },
   },
}
// ...
```

#### Styling
CSS files in the `src/pages/*` directories are not necessary. They are left in there in case you want 
to use it in combination with Tailwind CSS. **Feel free to delete them**.

Tailwind can be configured as usual in the `tailwind.config.cjs` file. See doc link below.

#### Internationalization (i18n)
To enable internationalization set the `localize` flag in the `vite.config.base.ts` to `true`.

The template includes a directory `locales` with a basic setup for english i18n. Enabling i18n
will pull the name and description for your extension from the english translation files instead
of the manifest.

Follow the instructions in the [official docs](https://developer.chrome.com/docs/extensions/reference/api/i18n#description) 
to add other translations and retrieve them in the extension.

If you don't need i18n you can ignore the `locales` directory until you need it, as it won't
be copied into the build folder unless the `localize` flag is set to `true`.

### Publish your extension to the CWS<a name="publish"></a>
To upload an extension to the Chrome store you have to pack (zip) it and then upload it to your item 
in the Chrome Web Store.

This repo includes a Github Action Workflow to create a 
[optimized prod build and the zip file](https://github.com/JohnBra/vite-web-extension/actions/workflows/ci.yml).

To run the workflow do the following:
1. Go to the **"Actions"** tab in your forked repository from this template
2. In the left sidebar click on **"Build and Zip Chrome Extension"**
3. Click on **"Run Workflow"** and select the main branch, then **"Run Workflow"**
4. Refresh the page and click the most recent run
5. In the summary page **"Artifacts"** section click on the generated **"vite-web-extension-chrome"**
6. Upload this file to the Chrome Web Store as described [here](https://developer.chrome.com/docs/webstore/publish/)

# Tech Docs <a name="tech"></a>
- [Vite](https://vitejs.dev/)
- [Vite Plugin](https://vitejs.dev/guide/api-plugin.html)
- [Chrome Extension with manifest 3](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Extension i18n](https://developer.chrome.com/docs/extensions/reference/api/i18n#description)
- [Cross browser development with webextension-polyfill](https://github.com/mozilla/webextension-polyfill?tab=readme-ov-file#webextension-browser-api-polyfill)
- [Rollup](https://rollupjs.org/guide/en/)
- [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- [Tailwind CSS](https://tailwindcss.com/docs/configuration)


# Hashchain Cicle
We are implementing the Payword payment schema in the context of blockchain. To do so, we are implementing a extension that allow storing and managing the hashchain and keep infos about the vendor and the channel's smart contract as well. All the operations consider that the user has selected a hashchain to operate. To our MVP, we need to ensure the following user stories, described in the following sections. To implement each flux, we need to provide to the Web page a proper interface (the current one is just to debbuging), so it is possible to fetch and update and query the selected hashchain's informations.

## Open Channel
### Send to extension the payment data
First, the user see page has values such as the chainid, vendor address, and ammount per hash.
Then, the user press button on the page that send this datas to the extension.

### Deploy the smart contract

#### Create the smart contract
The page has a input forms, that can be filled manually, but it is also possible to press a button to fetch the payment infos from the extension. The payments infos are the ones used to create the channel, such as hashchain tail (i.e, last hash item), ammount per hash, vendor address and chain id. The unique input manually selected by the user is to select how many hashes it will be used, and then the user can vizualise what is the total ammount being stored in that payment channel.

#### Propagate it to the blockchain
The page has a to button deploy the Smart Contract ( for testing, this can be mocked ).
After the deploy ( mocked ) the pages autoamtically update the hashchain data based with the Smart Contract address.

### Send data to Vendor
Now that the initial data is stored on the WebExtension, the user can send the infos to the vendor. The Vendors page has a forms that can fetch the data from the selected hashchain and then send it to the vendor.
The last step ( send to the vendor) is mocked but, in real life, it can be a write operation on database or anything chosen by the Vendor. The data that is send is sufficient to execute the payment validation:
1. Is the User sending a existing Smart Contract on my specified Chain Id?
2. Given that I read the data from the Smart Contract, is the User deploying to my address and blockchain?
3. Given the data that I read from the blockchain, Is the User paying the right ammount per minute of hash?

## Off chain payments
Here, things is getting more complex! Now we have 3 entities: 1. the web extension 2. the client on the browser and 3. the server ( that is mocked, since the debbug client is a purely static )

We are dealing with hashchains as payments. Each hash represent a coin, or a payment. The hash starts from the web extension, then send it to the page ( actually, the page request for the hash ) and then the page send it to the serve, that retrieves a ok ( sucess ) message. Ideally, this process repeats for each hash, but, due some limitation, the browser can have different behavior, and some work arrouns can be done to it work (i.e, send all the hashchain, or send the secret).

Further, to it properly work, we need to track what was the last hash send, because the vendor is also keeping track of it, so it wont accept the same payment twice! To sucecifully execute the off chain payments we have a few operations mode:

### Pop mode ( ideal world )
The pages requests for a hash item, the extension send the hashitem and decrease the index of the last send hash. For some reason we can lose this sync between vendor and user and the user can hit the button to force sync

### Full hashchain mode ( not ideal )
The pages send the full hash chain. Also has a button to ensure sync between extension and vendor.

### Secret mode ( kinda bad )
Less secure, but may work for some ocasion
The page request for the secret, then generate the hashchain locally
To spend the hashchain, the page need to generate the hashchain and then send the hashes to somewhere
This causes a sync overhead because the HashchainManagerExtension is not aware of what is being send
So, te user needs to sync the extension by informing the index of the last hash sended
Also, it is not secure because the page has the information of the hashchain secret!


## Close channel
Sometime, the vendor can close the channel and withdraw the ammount relative to its part of the payment channel. This calculation is done by calculating the ammount of hashes received. This assertion is done by recalculating the hashchain and verifying if the vendor is sending the correct hash, hash index. To close the channel, the vendor needs to access the smart contract (hence, he has the chain id and the smart contract address) and then send the infos to close the channel.

So, the vendor access the admin panel, exports the data to the extension, then go the the close channel pannel, and closes the channel.

# Credit <a name="credit"></a>
Heavily inspired by [Jonghakseo's vite chrome extension boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite). 
It uses SASS instead of TailwindCSS and is ~~slightly~~ _a lot_ less minimalist in case you want to check it out.

# Contributing <a name="contributing"></a>
Feel free to open PRs or raise issues!
