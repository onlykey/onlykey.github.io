const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const SriPlugin = require('webpack-subresource-integrity');

let plugins = [
    new HtmlWebpackPlugin({
        filename: 'encrypt.html',
        template: './encrypt-test.html',
        inject: 'body',
        minify: false,
        hash: false,
        cache: false,
        showErrors: false
    }),
    new HtmlWebpackPlugin({
        filename: 'decrypt.html',
        template: './decrypt-test.html',
        inject: 'body',
        minify: false,
        hash: false,
        cache: false,
        showErrors: false
    }),
    new UglifyJsPlugin({
        uglifyOptions: {
        ie8: false,
        ecma: 8,
        mangle: false,
        compress: true,
        warnings: false
      }
    }),
    new SriPlugin({
        hashFuncNames: ['sha256', 'sha384'],
        enabled: true
    }),
];

module.exports = {
    entry: ['./js/app.js', './js/forge.min.js', './js/kbpgp.js', './js/onlykey-api.js', './js/u2f-api.js', './js/nacl.min.js'],
    output: {
        path: path.resolve(__dirname, (process.env.OUT_DIR) ? process.env.OUT_DIR : './build'),
        filename: 'bundle.[hash].js',
        crossOriginLoading: 'anonymous'
    },
    plugins: plugins
}
