const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'production', // Set to 'production' for minification
  entry: {
    roulette: './src/js/roulette.js',
    bingo: './src/js/bingo.js',
    // canada: './src/js/canada.js',
    // canadaStyles: './src/css/canadaStyles.css',
    styles: './src/css/styles.css',
  },
  output: {
    filename: '[name].bundle.js', // Name of your JS file
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'img/[name].[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['main'],
      inject: 'body',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: './src/roulette.html',
      filename: 'roulette.html',
      chunks: ['roulette'],
      inject: 'body',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: './src/bingo.html',
      filename: 'bingo.html',
      chunks: ['bingo'],
      inject: 'body',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    // new HtmlWebpackPlugin({
    //   template: './src/canada.html',
    //   filename: 'canada.html',
    //   chunks: ['canada'],
    //   inject: 'body',
    //   minify: {
    //     collapseWhitespace: true,
    //     removeComments: true,
    //     removeRedundantAttributes: true,
    //     removeScriptTypeAttributes: true,
    //     removeStyleLinkTypeAttributes: true,
    //     useShortDoctype: true,
    //   },
    // }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
  },
};
