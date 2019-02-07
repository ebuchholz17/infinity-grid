var webpack = require("webpack");
var config = require("./webpack.config.js");

config.mode = "production";
config.devtool = undefined;

module.exports = config;
