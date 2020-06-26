const path = require('path');
// const webpack = require('webpack');
// const MinifyPlugin = require("babel-minify-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
// const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
// const SriPlugin = require('webpack-subresource-integrity');
const CspHtmlWebpackPlugin = require("csp-html-webpack-plugin");

var cspOptions = {
    enabled: true,
    policy: {
        'default-src': "'self'",
        'base-uri': "'none'",
        'object-src': "'none'",
        'script-src': ["'unsafe-inline'", "'self'", "'unsafe-eval'"],
        'style-src': ["'unsafe-inline'", "'self'", "'unsafe-eval'"],
        'img-src': [
            "'self'",
            "data:",
            "https://www.gravatar.com",
            "https://raw.githubusercontent.com/keybase/client/master/browser/images/icon-keybase-logo-128.png",
            "https://s3.amazonaws.com/keybase_processed_uploads/",

        ],
        'connect-src': [
            "'self'",
            "https://keybase.io",
            "https://onlykey.herokuapp.com", //for api
            "wss://onlykey.herokuapp.com", //for gun
            // "https://api.protonmail.ch",
            // "wss://www.peersocial.io"
        ]
    },
    hashEnabled: {
        'script-src': true,
        'style-src': true
    },
    nonceEnabled: {
        'script-src': true,
        'style-src': true
    },
    //processFn: defaultProcessFn
};

var pageFiles = getPagesList();

let plugins = [

    new HtmlWebpackPlugin({
        app_pages: pageFiles,
        dir_name: "./app",
        filename: './index.html',
        template: './src/index-src.html',
        inject: 'body',
        minify: (process.env.NODE_ENV === 'production') ? { collapseWhitespace: true, removeComments: true } : false,
        hash: (process.env.NODE_ENV === 'production') ? true : false,
        cache: false,
        showErrors: false,

        cspPlugin: cspOptions
    }),

    new HtmlWebpackPlugin({
        app_pages: pageFiles,
        dir_name: ".",
        filename: './app/index.html',
        template: './src/index-src.html',
        inject: 'body',
        minify: (process.env.NODE_ENV === 'production') ? { collapseWhitespace: true, removeComments: true } : false,
        hash: (process.env.NODE_ENV === 'production') ? true : false,
        cache: false,
        showErrors: false,

        cspPlugin: cspOptions
    })

];

for (var i in pageFiles) {
    var filename = pageFiles[i].name;
    plugins.push(
        new HtmlWebpackPlugin({
            app_pages: pageFiles,
            page: filename,
            filename: (process.env.NODE_ENV === 'production') ? './app/' + filename + '.html' : './app/' + filename + '.html',
            template: './src/app-src.html',
            inject: 'body',
            minify: (process.env.NODE_ENV === 'production') ? { collapseWhitespace: true, removeComments: true } : false,
            hash: (process.env.NODE_ENV === 'production') ? true : false,
            cache: false,
            showErrors: false,

            cspPlugin: cspOptions
        })
    );
}


plugins.push(new CspHtmlWebpackPlugin({}, {}));


module.exports = {
    mode: process.env.NODE_ENV,
    entry: [(process.env.NODE_ENV === 'production') ? './src/entry.js' : './src/entry-devel.js'],
    externals: {
        // u2f: './src/u2f-api.js',
        // Virtru: './src/virtru-sdk.min.js'
    },
    output: {
        path: path.resolve(__dirname, (process.env.OUT_DIR) ? process.env.OUT_DIR : './'),
        filename: './app/bundle.[hash].js',
        crossOriginLoading: 'anonymous'
    },
    plugins: plugins,
    module: {
        rules: [{
            test: /\.page\.html$/i,
            use: 'raw-loader',
        }, {
            test: /\.modal\.html$/i,
            use: 'raw-loader',
        }]
    },
};

function getPagesList() {

    var _files = [];


    var plugins = require("./src/plugins.js");
    if (!(process.env.NODE_ENV === 'production')) {
        plugins = [].concat(plugins, require("./src/plugins-devel.js"));
    }

    for (var i in plugins) {
        if (plugins[i].pagesList) {
            for (var j in plugins[i].pagesList) {
                _files.push({
                    name: j,
                    icon: plugins[i].pagesList[j].icon,
                    title: plugins[i].pagesList[j].title,
                    sort: plugins[i].pagesList[j].sort
                });
            }
        }
    }

    _files.sort(function(a,b){
        if(!a.sort)a.sort=10000;
        if(!b.sort)b.sort=10000;
        return b.sort - a.sort;
    });
    _files.reverse();
    
    return _files;
}