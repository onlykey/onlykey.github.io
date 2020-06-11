


Installing, Building
-------


__Installing build tools__

```
npm install
```

__Running build__

```
npm run build
```

This runs `bash ./BUILD.sh` script that tells it to build the `./docs` folder

_All source modifications need to be in `./src` folder_

*Do Not Touch ``./past_releases` folder*

For final release run `npm run build` then change `version` in `./src/release.json`, then re-run `npm run build`

__Running the app__

Run `node ./index.js`, This will fire up a nodejs-express app to serv the app


Createing a new `/app/page`
--------


Start by creating a html file in folder  `./src/app_src/pages/page_files/`, name it `page-name.page.html`

Clone a copy of `_template_.js` in `./src/app_src/pages/page_actions` to `page-name.page.js`

Edit `./src/app_src/pages/pages.js`,  and add your `page-name`  to the pagesList array.

_the source in `_template_.js` will show more details_


Createing a new `architect plugin`
--------

This project uses [https://github.com/c9/architect](https://github.com/c9/architect)


Start by heading to dir `./app_src` and make a new folder for your plugin,  then copy `./app_src/_template_.js`
to your new folder, renaming the file to your project name

Change `_template_.js` source accordingly to match your plugin_name


_the source in `_template_.js` will show more details_