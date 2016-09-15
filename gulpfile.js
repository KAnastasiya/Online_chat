'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync');
const gulpBase64 = require('gulp-to-base64');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const imageminPngquant = require('imagemin-pngquant');
const base64 = require('gulp-base64');
const gulpsync = require('gulp-sync')(gulp);
const del = require('del');
const webpack = require('webpack-stream');
const named = require('vinyl-named');
const plugins = require('gulp-load-plugins')();


const publicDir = './';


gulp.task('cleanPublic', () => {
  return del(publicDir);
});


gulp.task('browserSync', () => {
  browserSync({
    server: {
      baseDir: publicDir,
      index: 'index.html'
    },
    notify: false
  });
});


gulp.task('pug', () => {
  return gulp.src('./src/index.pug')
  .pipe(plugins.plumber({ errorHandler: plugins.notify.onError() }))
  .pipe(plugins.pug())
  .pipe(gulp.dest(publicDir));
});


gulp.task('cleanIconOpt', () => {
  return del('./src/icon-opt');
});

gulp.task('icon', ['cleanIconOpt'], () => {
  return gulp.src(['./src/icon/*'])
  .pipe(plugins.imagemin([
    imageminPngquant({quality: '50-80'}),
    plugins.imagemin.svgo({removeViewBox: true})
  ]))
  .pipe(gulp.dest('./src/icon-opt'));
});


gulp.task('scss', gulpsync.sync(['icon']), () => {
  return gulp.src(['./src/scss/style.scss'])
  .pipe(plugins.plumber({ errorHandler: plugins.notify.onError() }))
  .pipe(plugins.sourcemaps.init())
  .pipe(plugins.scss())
  .pipe(plugins.autoprefixer([
    'last 2 Chrome versions',
    'last 2 Firefox versions',
    'last 2 Opera versions',
    'last 2 Safari versions',
    'Explorer >= 10',
    'last 2 Edge versions',
    ],
    { cascade: false }
  ))
  .pipe(plugins.csscomb('./.csscomb.json'))
  .pipe(base64({
    baseDir: './src',
    extensions: ['svg', 'png', /\.jpg#datauri$/i],
    debug: true
  }))
  .pipe(plugins.sourcemaps.write())
  .pipe(plugins.cssnano())
  .pipe(plugins.rename({suffix: '.min'}))
  .pipe(gulp.dest(publicDir));
});



gulp.task('audio', () => {
  return gulp.src(['./src/audio/*.mp3'])
  .pipe(gulpBase64({ outPath:'./src/js/audio.json' }))
  .pipe(gulp.dest('./src/audio/'))
});

gulp.task('script', ['audio'], () => {
  return gulp.src(['./src/js/script.js'])
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'Webpack',
      message: err.message
    }))
  }))
  .pipe(named())
  .pipe(webpack(require('./webpack.config.js')))
  .pipe(plugins.rename({suffix: '.min'}))
  .pipe(gulp.dest(publicDir));
});


gulp.task('default', gulpsync.sync(['pug', 'scss' ,'browserSync']), () => {
  gulp.watch(['./src/*.pug'], gulpsync.sync(['pug', browserSync.reload]));
  gulp.watch(['./src/scss/*'], gulpsync.sync(['scss', browserSync.reload]));
  gulp.watch(['./src/icon/*'], gulpsync.sync(['scss', browserSync.reload]));
  gulp.watch(['./src/**/*.js'], gulpsync.sync(['script', browserSync.reload]));
});
