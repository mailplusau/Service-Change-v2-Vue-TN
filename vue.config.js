const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const packageJson = require('./package.json')

module.exports = {
  lintOnSave: false,
  css: {
    extract: false,
  },
  configureWebpack: {
    optimization: {
      splitChunks: false // makes there only be 1 js file - leftover from earlier attempts but doesn't hurt
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: packageJson.netsuite.htmlFile,
        template: 'public/index.html',  //template file to embed the source
        inlineSource: '.(js|css)$' // embed all javascript and css inline
      }),
      new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin)
    ]
  }
}
