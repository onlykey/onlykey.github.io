const path = require('path');
const webpack = require('webpack');
const MinifyPlugin = require("babel-minify-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
// const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const SriPlugin = require('webpack-subresource-integrity');

let plugins = [

    new HtmlWebpackPlugin({
        dir_name: "./app",
        filename: (process.env.NODE_ENV === 'production') ? './index.html' : './index.html',
        template: './src/index-src.html',
        inject: 'body',
        minify: (process.env.NODE_ENV === 'production') ? { collapseWhitespace: true, removeComments: true } : false,
        hash: (process.env.NODE_ENV === 'production') ? true : false,
        cache: false,
        showErrors: false
    }),
    
    new HtmlWebpackPlugin({
        dir_name: ".",
        filename: (process.env.NODE_ENV === 'production') ? './index.html' : './app/index.html',
        template: './src/index-src.html',
        inject: 'body',
        minify: (process.env.NODE_ENV === 'production') ? { collapseWhitespace: true, removeComments: true } : false,
        hash: (process.env.NODE_ENV === 'production') ? true : false,
        cache: false,
        showErrors: false
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
            showErrors: false
        })
    );
}

plugins.push(
    new webpack.ProvidePlugin({
    	"Gun":"gun.js",
    	"Gun.SEA":"gun/sea.js",    	
    //   nacl: './nacl.min.js',
    //   forge: './forge.min.js',
    //   kbpgp: './kbpgp.js',
    //   'auth_sign()': './onlykey-api.js',
    //   'auth_decrypt()': './onlykey-api.js',
    })
);


if (process.env.NODE_ENV === 'production') {
    plugins.push(new MinifyPlugin({
        consecutiveAdds: false,
        deadcode: false,
        evaluate: false,
        flipComparisons: false,
        guards: false,
        infinity: false,
        mangle: false,
        mergeVars: false,
        numericLiterals: false,
        propertyLiterals: false,
        removeConsole: true,
        removeDebugger: true
    }, {
        exclude: ["./src/forge.min.js", "./src/nacl.min.js", "/~/gun/sea.js" ],
	include:[]
    }));
    /*
    plugins.push(new SriPlugin({
        hashFuncNames: ['sha256', 'sha384'],
        enabled: process.env.NODE_ENV === 'production'
    }));*/
}

module.exports = {
    entry: ['./src/app.js'],
    externals: {
        u2f: './src/u2f-api.js',
        Virtru: './src/virtru-sdk.min.js'
    },
    output: {
        path: path.resolve(__dirname, (process.env.OUT_DIR) ? process.env.OUT_DIR : './dev'),
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
    //requiring path and fs modules
    const path = require('path');
    const fs = require('fs');
    //joining path of directory 
    const directoryPath = path.join(__dirname, 'src', 'app_src', 'pages', 'page_files');
    //passsing directoryPath and callback function
    var files = fs.readdirSync(directoryPath);
    var _files = [];
    //listing all files using forEach
    files.forEach(function(file) {
        // Do whatever you want to do with the file
        _files.push(file.split(".")[0]);
    });
    return _files;
}
