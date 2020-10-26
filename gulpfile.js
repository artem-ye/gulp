// Gulp modules
//const gulp = require('gulp');
const { watch, series, parallel, src, dest} = require('gulp');

const fileinclude = require('gulp-file-include');
const del = require('del');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const groupcssmediaqueries = require('gulp-group-css-media-queries');
const cleancss = require('gulp-clean-css');
const rename = require('gulp-rename');
const uglifyjs = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');

const PATH_PREFIX_BUILD = "build";
const PATH_BUILD = "./build/";
const PATH_PREFIX_SRC = "src";

const PROJECT_PATH = {  
  build: { 
      html:  PATH_PREFIX_BUILD + '/',
      js:    PATH_PREFIX_BUILD + '/js/',
      css:   PATH_PREFIX_BUILD + '/css/',
      img:   PATH_PREFIX_BUILD + '/img/',
      fonts: PATH_PREFIX_BUILD + '/fonts/'
  },
  src: { 
      html:  PATH_PREFIX_SRC + '/*.html', 
      js:    PATH_PREFIX_SRC + '/js/*.js',
      css:   PATH_PREFIX_SRC + '/css/*.scss',
      img:   PATH_PREFIX_SRC + '/img/**/*.*', 
      fonts: PATH_PREFIX_SRC + '/fonts/**/*.*'
  },
  watch: { 
      html:  PATH_PREFIX_SRC + '/**/*.html',
      js:    PATH_PREFIX_SRC + '/js/*.js',
      css:   PATH_PREFIX_SRC + '/css/*.scss',
      img:   PATH_PREFIX_SRC + '/img/**/*.*',
      fonts: PATH_PREFIX_SRC + '/fonts/**/*.*'
  },
  clean: PATH_BUILD
};

//////////////////////////////////////////////////////////////////////////
// Browser sync 
//////////////////////////////////////////////////////////////////////////

const objBrowserSync = require("browser-sync").create();

function browserSyncStart(params) {

  const pluginParams = {
    server: {
      baseDir: PATH_BUILD
    },
    port: 3000,
    notify: false
  };

  objBrowserSync.init(
    pluginParams
  );

}

//////////////////////////////////////////////////////////////////////////
// Src build
//////////////////////////////////////////////////////////////////////////

function buildHtml() {    

  return src(PROJECT_PATH.src.html)
    .pipe(fileinclude())
    .pipe(dest(PROJECT_PATH.build.html))
    .pipe(objBrowserSync.stream());

}

function buildCss() {

  const scssOpts = {
    outputStyle: "expanded"
  };

  const autoprefixerOpts = {
    overrideBrowsersList: ["last 9 versions"],
    cascade: true
  };

  const renameOpts = {
    extname: ".min.css"
  };

  return src(PROJECT_PATH.src.css)    
    .pipe(scss(scssOpts))
    .pipe(groupcssmediaqueries())
    //.pipe(autoprefixer())
    .pipe(autoprefixer(autoprefixerOpts))
    .pipe(dest(PROJECT_PATH.build.css))
    .pipe(cleancss())
    .pipe(rename(renameOpts))
    .pipe(dest(PROJECT_PATH.build.css))
    .pipe(objBrowserSync.stream());

}

function buildJs() {    

  const renameOpts = {
    extname: ".min.js"
  };

  return src(PROJECT_PATH.src.js)
    .pipe(fileinclude())
    .pipe(dest(PROJECT_PATH.build.js))
    .pipe(uglifyjs())
    .pipe(rename(renameOpts))
    .pipe(dest(PROJECT_PATH.build.js))
    .pipe(objBrowserSync.stream());

}


function buildImg() {    

  const imageminOpts = {
    progressive: true,
    svgoPlugins: [{ removeViewBox: false }],
    interlaced: true,
    optimizationLevel: 3
  };

  return src(PROJECT_PATH.src.img)    
    .pipe(imagemin(imageminOpts))
    .pipe(dest(PROJECT_PATH.build.img))
    .pipe(objBrowserSync.stream());

}



//////////////////////////////////////////////////////////////////////////
// Watch
//////////////////////////////////////////////////////////////////////////

function clearBuild() {
  return del(PROJECT_PATH.clean);
}

function watchAndBuild() {
  watch(PROJECT_PATH.watch.html, buildHtml);
  watch(PROJECT_PATH.watch.css, buildCss);
  watch(PROJECT_PATH.watch.js, buildJs);
  watch(PROJECT_PATH.watch.img, buildImg);
}

//////////////////////////////////////////////////////////////////////////
// Tasks
//////////////////////////////////////////////////////////////////////////

let buildAllTask = series(clearBuild, 
    parallel(buildCss, buildJs, buildImg, buildHtml)
);

let watchTask = parallel(browserSyncStart, buildAllTask, watchAndBuild);

exports.build = buildAllTask;
exports.default = watchTask;
