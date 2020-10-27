//////////////////////////////////////////////////////////////////////////
// INCLUDE 
//////////////////////////////////////////////////////////////////////////

// Gulp core methods
const { watch, series, parallel, src, dest} = require('gulp');

const fs = require('fs');
const del = require('del');

// Plugins
const fileinclude = require('gulp-file-include');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const groupcssmediaqueries = require('gulp-group-css-media-queries');
const cleancss = require('gulp-clean-css');
const rename = require('gulp-rename');
const uglifyjs = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
// webp 
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const webpcss = require('gulp-webp-css');
// fonts
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

//////////////////////////////////////////////////////////////////////////
// CONSTS
//////////////////////////////////////////////////////////////////////////

// Project paths
const PATH_PREFIX_BUILD = "build";
const PATH_BUILD        = "./"+PATH_PREFIX_BUILD+"/";
const PATH_PREFIX_SRC   = "src";

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

  clean: PATH_BUILD,
  browserSyncBaseDir: PATH_BUILD

};

// Plugins options
const PLUGINS_OPTIONS = {

  browserSync: {
    server: {      
      baseDir: PROJECT_PATH.browserSyncBaseDir // -> ./build/
    },
    port: 3000,
    notify: false
  },

  // gulp-sass
  scss: {
    outputStyle: "expanded"
  },

  // gulp-autoprefixer
  autoprefixer: {    
    cascade: true,
    overrideBrowserslist: ['last 5 versions'],
    grid: "autoplace"
  },

  // gulp-imagemin
  imagemin: {
    progressive: true,
    svgoPlugins: [{ removeViewBox: false }],
    interlaced: true,
    optimizationLevel: 3
  },

  webp: {
    quality: 70
  }

}

//////////////////////////////////////////////////////////////////////////
// GLOBAL OBJECTS
//////////////////////////////////////////////////////////////////////////

const objBrowserSync = require("browser-sync").create();

//////////////////////////////////////////////////////////////////////////
// Src build API
//////////////////////////////////////////////////////////////////////////

function clearBuild() {
     
  return del(PROJECT_PATH.clean);

}

function buildHtml() {    

  return src(PROJECT_PATH.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(PROJECT_PATH.build.html))
    .pipe(objBrowserSync.stream());

}

function buildCss() {  
 
  const scssOpts = PLUGINS_OPTIONS.scss;
  const autoprefixerOpts = PLUGINS_OPTIONS.autoprefixer;
  const renameOpts = {extname: ".min.css"};
  
  return src(PROJECT_PATH.src.css)    
    .pipe(scss(scssOpts))    
    .pipe(groupcssmediaqueries())        
    .pipe(autoprefixer(autoprefixerOpts))        
    .pipe(webpcss())
    .pipe(dest(PROJECT_PATH.build.css))        
    // Minify and copy to *.min.css
    .pipe(cleancss())
    .pipe(rename(renameOpts))
    .pipe(dest(PROJECT_PATH.build.css))   
    .pipe(objBrowserSync.stream());

}

function buildJs() {    

  const renameOpts = {extname: ".min.js"};

  return src(PROJECT_PATH.src.js)
    .pipe(fileinclude())
    .pipe(dest(PROJECT_PATH.build.js))
    .pipe(uglifyjs())
    // Minify and copy to *.min.js
    .pipe(rename(renameOpts))
    .pipe(dest(PROJECT_PATH.build.js))
    .pipe(objBrowserSync.stream());

}

function buildImg() {    
  
  const imageminOpts = PLUGINS_OPTIONS.imagemin;
  const webpOpts = PLUGINS_OPTIONS.webp;

  return src(PROJECT_PATH.src.img) 
    // webp
    .pipe(webp(webpOpts))
    .pipe(dest(PROJECT_PATH.build.img))    
    // normal img
    .pipe(src(PROJECT_PATH.src.img))
    .pipe(imagemin(imageminOpts))
    .pipe(dest(PROJECT_PATH.build.img))
    .pipe(objBrowserSync.stream());

}

function buildFonts() {

  // ttf2wof
  return src(PROJECT_PATH.src.fonts)
    .pipe(ttf2woff())    
    .pipe(dest(PROJECT_PATH.build.fonts))    
    // ttf2wof2
    .pipe(src(PROJECT_PATH.src.fonts))
    .pipe(ttf2woff2())    
    .pipe(dest(PROJECT_PATH.build.fonts))
    .pipe(objBrowserSync.stream());


}

//////////////////////////////////////////////////////////////////////////
// Local web server with live reload API
//////////////////////////////////////////////////////////////////////////

function browserSyncStart(params) {

  objBrowserSync.init(PLUGINS_OPTIONS.browserSync);
 
 }  

function watchAndBuild() {

  watch(PROJECT_PATH.watch.html, buildHtml);
  watch(PROJECT_PATH.watch.css, buildCss);
  watch(PROJECT_PATH.watch.js, buildJs);
  watch(PROJECT_PATH.watch.img, buildImg);
  watch(PROJECT_PATH.watch.fonts, buildFonts);

}


//////////////////////////////////////////////////////////////////////////
// TASKS
//////////////////////////////////////////////////////////////////////////

let rebuildAllTask = series(clearBuild, 
    parallel(buildCss, buildJs, buildImg, buildFonts, buildHtml)
);

let startDevServerTask = parallel(browserSyncStart, rebuildAllTask, watchAndBuild);

exports.rebuild = rebuildAllTask;
exports.default = startDevServerTask;
