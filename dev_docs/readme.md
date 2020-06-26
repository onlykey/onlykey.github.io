


Installing, Building, Versioning
-------

__Installing build tools__

```
npm install
```

__Running build__

```
npm run build
```

This runs `bash ./BUILD.sh` script that tells it to build the `./docs` folder in `development` mode

_All source modifications need to be in `./src` folder_

*Do Not Touch ``./past_releases` folder*

For final release run `npm run build` then change `version` in `./src/release.json`, then re-run `npm run build`

__Running the app__

Run `node ./index.js`, This will fire up a nodejs-express app to serv the app


**production**
to build production
```
npm run build-production
```

_heroku will build production automaticly to serve, so no need to do this ourselves_


Createing Plugins using `architect`
--------

This project uses [https://github.com/c9/architect](https://github.com/c9/architect)


**Createing a new Page Plugin**


Example to create `/app/myplugin`

Start by creating a new folder in  `./src/plugins/myplugin`, 

Copy file  `./src/plugins/_template_page_.js` to `./src/plugins/myplugin/myplugin.js`

_the source `./src/plugins/myplugin/myplugin.js` will show more details on createing html file naming_

Start Developing in `./src/plugins/myplugin/myplugin.js`

**To add plugin to build**

Edit file `./src/plugins-devel.js`

and add code below to bottom

```
module.exports.push(require("./plugins/myplugin/myplugin.js"));
```

This will add enable the new app page
