var path = require('path')
var webpack = require('webpack')
var BrowserSyncPlugin = require('browser-sync-webpack-plugin')

// Phaser webpack config
var phaserModule = path.join(__dirname, '/node_modules/phaser-ce/')
var phaser = path.join(phaserModule, 'build/custom/phaser-split.js')
var pixi = path.join(phaserModule, 'build/custom/pixi.js')
var p2 = path.join(phaserModule, 'build/custom/p2.js')

var definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true'))
})

console.log(phaser);

module.exports = {
  entry: {
    app: [
      'babel-polyfill',
      path.resolve(__dirname, 'src/main.ts')
    ],
    vendor: ['pixi', 'p2', 'phaser-ce', 'webfontloader']
  },
  devtool: 'cheap-source-map',
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'dist'),
    publicPath: './dist/',
    filename: 'bundle.js'
  },
  watch: true,
  plugins: [
    definePlugin,
    new webpack.optimize.CommonsChunkPlugin({ name: 'vendor'/* chunkName= */, filename: 'vendor.bundle.js'/* filename= */}),
    new BrowserSyncPlugin({
      host: process.env.IP || 'localhost',
      port: process.env.PORT || 4000,
      server: {
        baseDir: ['./', './build']
      },
      open: false,
    })
  ],
  module: {
    rules: [
      { test: /\.tsx?$/, use: ['ts-loader'], include: path.join(__dirname, 'src') },
      { test: /pixi\.js/, use: ['expose-loader?PIXI'] },
      { test: /phaser-split\.js$/, use: ['expose-loader?Phaser'] },
      { test: /p2\.js/, use: ['expose-loader?p2'] },
      { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      'phaser-ce': phaser,
      'pixi': pixi,
      'p2': p2
    }
  }
}
