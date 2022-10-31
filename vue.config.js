const path = require("path");
const fs = require("fs");
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

// Generate pages object
const pages = {};

function getEntryFile(entryPath) {
  let files = fs.readdirSync(entryPath);
  return files;
}

const chromeName = getEntryFile(path.resolve(`src/entry`));

function getFileExtension(filename) {
  return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)[0] : undefined;
}
chromeName.forEach((name) => {
  const fileExtension = getFileExtension(name);
  const fileName = name.replace("." + fileExtension, "");
  pages[fileName] = {
    entry: `src/entry/${name}`
  };
});

const isDevMode = process.env.NODE_ENV === "development";

module.exports = {
  pages,
  filenameHashing: false,
  chainWebpack: (config) => {
    config.plugin("copy").use(require("copy-webpack-plugin"), [
      {
        patterns: [
          {
            // from: path.resolve(`src/manifest.${process.env.NODE_ENV}.json`),
            from: path.resolve(`src/manifest.json`),
            to: `${path.resolve("dist")}/manifest.json`,
          },
          {
            from: path.resolve("src/assets"),
            to: `${path.resolve("dist")}/assets`,
          },
        ],
      },
    ]);
  },
  configureWebpack: {
    // 解决background与content打包的问题
    entry: {
      background: "./src/script/background.ts",
      content: "./src/script/content.ts",
      injected: "./src/script/injected.ts"
    },
    output: {
      filename: `[name].js`,
      chunkFilename: `[name].js`,
    },
    resolve: {
      //配置路径别名
      alias: {
        'assets': '@/assets',
        'constant': '@/constant',
        'helper': '@/helper',
        'views': '@/views',
        'util': '@/util',
      }
    },
    devtool: isDevMode ? 'inline-source-map' : false,
    plugins: [new NodePolyfillPlugin()],
  },
  css: {
    extract: false, // Make sure the css is the same
  },
};
