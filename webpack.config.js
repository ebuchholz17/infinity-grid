var webpack = require("webpack");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var WriteFilePlugin = require("write-file-webpack-plugin");
var path = require('path');

module.exports = {
    entry: "./src/code/main",
    output: {
        filename: "infinity-grid.js",
        path: path.join(__dirname, "./dist")
    },
    mode: "development",
    module: {
        rules: [
            { test: /\.ts$/, loader: "ts-loader" },
            { test: /\.less$/, loader: "raw-loader" }
        ]
    },
    plugins: [
        new WriteFilePlugin(),
        new CopyWebpackPlugin([
            {
                from: "src/assets",
                to: "assets",
            },
            {
                from: "src/index.html",
                to: "index.html",
            }
        ]),
        new webpack.ProvidePlugin({
            PIXI: "pixi.js",
            TWEEN: "tween.js"
        })
    ],
    resolve: {
        alias: {
            FontFaceObserver: path.resolve("./node_modules/fontfaceobserver/fontfaceobserver.standalone.js")
        },
        extensions: [
            ".js",
            ".ts",
            ".json",
            ".less"
        ],
        modules: [
            "src",
            "src/styles",
            "node_modules"
        ]
    },
    devtool: "source-map"
};
