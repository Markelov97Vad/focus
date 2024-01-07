const gulp = require('gulp');
const concatCss = require('gulp-concat-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');
const del = require('del');
const browserSync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mediaquery = require('postcss-combine-media-query');
const cssnano = require('cssnano');
const htmlMinify = require('html-minifier');
const imagemin = require('gulp-imagemin');
const map = require('gulp-sourcemaps');

const gulpPug = require('gulp-pug');

/**
 * {build}
 * выполнение задачи по очереди:
 * -  очистка папки dist
 * - выполнение скриптов в параллельном режиме
 * 
 * {watchApp}
 * выполнение в парраллельном режиме build и watchFiles
 * cледит за файлами в src/ и делает пересборку после каждого изменения этих файлови, также перезагружает страницу в браузере
 */
const build = gulp.series(clean, gulp.parallel(pug, css, images, fonts, scripts));
const watchapp = gulp.parallel(build, watchFiles, serve);

const pathConfig = {
  html: 'src/**/*.html',
  css: 'src/**/*.css',
  fonts: 'src/fonts/**/*.{woff,woff2}',
  image: 'src/images/**/*.{jpg,png,svg,gif,ico,webp,avif}',
  build: './dist',
  styleFile: 'styles.css',
  pug: 'src/pages/**/*.pug',
  js: 'src/scripts/**/*.js'
} 

function html() {
  const options = {
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseWhitespace: true,
    minifyCSS: true,
    keepClosingSlash: true
  }

  return gulp.src(pathConfig.html) // откуда брать HTML-файлы.
        .pipe(plumber()) // Чтобы избежать ошибок при сборке
        .on('data', function(file) {
          const bufferFile = Buffer.from(htmlMinify.minify(file.contents.toString(), options));
          file.contents = bufferFile
          return file;
        })
        .pipe((gulp.dest('dist/'))) // точка назначения
        .pipe(browserSync.reload({stream: true})) // перезагрузка браузера при выполнении каждой команды
}
      
function css() {
  const plugins = [
    autoprefixer(),
    mediaquery(),
    cssnano()
  ];
  return gulp.src(pathConfig.css)
        .pipe(plumber())
        .pipe(concatCss(pathConfig.styleFile)) // объединение css в один файл
        .pipe(postcss(plugins))
        .pipe(gulp.dest('dist/'))
        .pipe(browserSync.reload({stream: true}))
}

function fonts() {
  return gulp.src(pathConfig.fonts)
          .pipe(plumber())
          .pipe(gulp.dest('dist/fonts'))
          .pipe(browserSync.reload({stream: true}))
}

function scripts() {
	return gulp.src(pathConfig.js, {
      sourcemaps: true
    })
    .pipe(babel())
		// .pipe(map.init())
		.pipe(uglify())
		.pipe(concat('main.min.js'))
		// .pipe(map.write('../sourcemaps'))
		.pipe(gulp.dest('dist/js/'))
    .pipe(browserSync.reload({stream: true}))
}

function images() {
  const options = [
    imagemin.gifsicle({interlaced: true}),
    imagemin.mozjpeg({quality: 75, progressive: true}),
    imagemin.optipng({optimizationLevel: 5}),
    imagemin.svgo({
      plugins: [
        {
          name: 'removeViewBox',
          active: true
        },
        {
          name: 'cleanupIDs',
          active: false
        }
      ]
    })
  ];
  return gulp.src(pathConfig.image)
        .pipe(imagemin(options))
        .pipe(gulp.dest('dist/images'))
        .pipe(browserSync.reload({stream: true}))
}

function clean() { // очистка паки dist
  return del('dist');
}

function watchFiles() { // отслеживание изменения в файлах
  // gulp.watch([pathConfig.pug], pug);
  gulp.watch(['src/**/*.pug'], pug);
  gulp.watch([pathConfig.html], html);
  gulp.watch([pathConfig.css], css);
  gulp.watch([pathConfig.image], images);
  gulp.watch([pathConfig.js], scripts);
}

function serve() { // 
  browserSync.init({
    server: {
      baseDir: pathConfig.build
    }
  })
}

function pug() {
  return gulp.src(pathConfig.pug)
        .pipe(gulpPug({
          pretty: true
        }))
        .pipe(gulp.dest('dist/'))
        .pipe(browserSync.reload({stream: true}));
} 

exports.css = css; // для вызыва функции в командной строке
exports.images = images; 
exports.html = html;
exports.pug = pug;
exports.scripts = scripts;
exports.clean = clean;
exports.build = build;
exports.watchapp = watchapp;
exports.default = watchapp; // запуск по дефолту командой gulp