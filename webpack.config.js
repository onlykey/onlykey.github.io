const path = require('path');
const webpack = require('webpack');
const MinifyPlugin = require("babel-minify-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
// const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const SriPlugin = require('webpack-subresource-integrity');
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
            "https://www.gravatar.com",
            "https://raw.githubusercontent.com/keybase/client/master/browser/images/icon-keybase-logo-128.png",
            "https://s3.amazonaws.com/keybase_processed_uploads/",
            
        ],
        'connect-src': [
            "'self'", 
            "https://keybase.io",
            "https://onlykey.herokuapp.com",
            "wss://onlykey.herokuapp.com",
            // "https://api.protonmail.ch",
            // "wss://www.peersocial.io",
            // "https://onlykey.herokuapp.com"
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

let plugins = [

    new HtmlWebpackPlugin({
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

var pageFiles = getPagesList();
for (var i in pageFiles) {
    var filename = pageFiles[i];
    plugins.push(
        new HtmlWebpackPlugin({
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


plugins.push(new CspHtmlWebpackPlugin({}, {}))


module.exports = {
    mode: process.env.NODE_ENV,
    entry: ['./src/app.js'],
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
        }]
    },
};

function getPagesList() {
    
    var _files = [];
    
    if(false){
        const path = require('path');
        const fs = require('fs');
        const directoryPath = path.join(__dirname, 'src', 'app_src', 'pages', 'page_files');
        var files = fs.readdirSync(directoryPath);
        files.forEach(function(file) {
            _files.push(file.split(".")[0]);
        });
    }else{
               
         var plugins = require("./src/plugins.js")
         
         for(var i in plugins){
           if(plugins[i].pagesList){
               for(var j in plugins[i].pagesList){
                _files.push(j);
               }
           }
         }
         
    }
    
    return _files;
}