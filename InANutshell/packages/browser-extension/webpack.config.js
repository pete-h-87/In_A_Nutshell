const path = require("path");
const webpack = require("webpack");
require('dotenv').config();

module.exports = {
  mode: "development",
  devtool: "cheap-source-map",

  entry: {
    content: "./src/content.js",
    background: "./src/background.js",
    popup: "./src/popup.js",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },

  resolve: {
    modules: ["node_modules", path.resolve(__dirname, "../../node_modules")],
    alias: {
      "@inanutshell/shared": path.resolve(__dirname, "../shared/src"),
    },
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },

  optimization: {
    minimize: false, // Keep readable for development
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    }),
  ],

};
