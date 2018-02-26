const path = require('path');
const webpack = require('webpack');
const MinifyPlugin = require("babel-minify-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const SriPlugin = require('webpack-subresource-integrity');

let plugins = [
    new HtmlWebpackPlugin({
        filename: (process.env.NODE_ENV === 'production') ? './encrypt.html' : './encrypt-dev.html',
        template: './src/encrypt-src.html',
        inject: 'body',
        minify: (process.env.NODE_ENV === 'production') ? { collapseWhitespace: true, removeComments: true } : false,
        hash: (process.env.NODE_ENV === 'production') ? true : false,
        cache: false,
        showErrors: false
    }),
    new HtmlWebpackPlugin({
        filename: (process.env.NODE_ENV === 'production') ? './decrypt.html' : './decrypt-dev.html',
        template: './src/decrypt-src.html',
        inject: 'body',
        minify: (process.env.NODE_ENV === 'production') ? { collapseWhitespace: true, removeComments: true } : false,
        hash: (process.env.NODE_ENV === 'production') ? true : false,
        cache: false,
        showErrors: false
    }),
    new HtmlWebpackPlugin({
        filename: (process.env.NODE_ENV === 'production') ? './index.html' : './index-dev.html',
        template: './src/index-src.html',
        inject: 'body',
        minify: (process.env.NODE_ENV === 'production') ? { collapseWhitespace: true, removeComments: true } : false,
        hash: (process.env.NODE_ENV === 'production') ? true : false,
        cache: false,
        showErrors: false
    }),
    new webpack.ProvidePlugin({
      nacl: './nacl.min.js',
      forge: './forge.min.js',
      kbpgp: './kbpgp.js',
      _status: './app.js',
      poll_delay: './app.js',
      poll_type: './app.js'
    })
];

if (process.env.NODE_ENV === 'production') {
    plugins.push(new MinifyPlugin(
          minifyOpts={
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
        },
        pluginOpts={
          exclude: ["./src/forge.min.js", "./src/nacl.min.js"]
        }
      ));
    plugins.push(new SriPlugin({
        hashFuncNames: ['sha256', 'sha384'],
        enabled: process.env.NODE_ENV === 'production'
    }));
}

module.exports = {
    entry: ['./src/app.js'],
    externals: {
      u2f: './u2f-api.js'
    },
    output: {
        path: path.resolve(__dirname, (process.env.OUT_DIR) ? process.env.OUT_DIR : './dev'),
        filename: 'bundle.[hash].js',
        crossOriginLoading: 'anonymous'
    },
    plugins: plugins
}
