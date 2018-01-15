const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');
//const pug = require('./webpack/pug');
const handlebars = require('./webpack/handlebars');
const devServer = require('./webpack/devserver');
const sass = require('./webpack/sass');
const css = require('./webpack/css');
const extractCss = require('./webpack/css.extract');
const images = require('./webpack/images');

const PATHS = {
    source: path.join(__dirname, 'source'),
    build: path.join(__dirname, 'build')
};

const common = merge([
    {
        entry: PATHS.source + '/js/index.js',
        output: {
            path: PATHS.build,
            filename: 'js/[name].js'
        },
        plugins: [
            new HtmlWebpackPlugin({
            filename: 'index.html',
            //chunks: ['index', 'common'],
            template: PATHS.source + '/index.hbs',
            }),
            new webpack.optimize.CommonsChunkPlugin({
                name: 'common'
            })
        ],
    },
    //pug(),
    handlebars(),
    images()
]);


module.exports =  (env) => {
    if (env === 'production') {
        return merge([
            common,
            extractCss()
        ]);
    }
    if (env === 'development') {
        return merge([
            common,
            devServer(),
            sass(),
            css()
        ])
    }
};