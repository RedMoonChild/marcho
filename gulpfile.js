  const {src, dest, watch, parallel, series} = require('gulp');

  const scss = require('gulp-sass')(require('sass'));
  const concat = require('gulp-concat');
  const uglify = require('gulp-uglify-es').default;
  const browserSync = require('browser-sync').create();
  const autoprefixer = require('gulp-autoprefixer');
  const clean = require('gulp-clean');
  const avif = require('gulp-avif');
  const webp = require('gulp-webp');
  const imagemin = require('gulp-imagemin');
  const newer = require('gulp-newer');
  const svgFilter = require('gulp-filter'); 
  // чтобы фильтровать svg от gulp-avif
  const svgSprite = require('gulp-svg-sprite');
  const fonter = require('gulp-fonter');
  const ttf2woff2 = require('gulp-ttf2woff2');
  const plumber = require('gulp-plumber');
  // пропускает ошибки при чтении шрифтов
  const include = require('gulp-include');

  function pages() {
    return src('app/pages/*.html')
      .pipe(include({
        includePaths: 'app/components'
      }))
      .pipe(dest('app'))
      .pipe(browserSync.stream())
  }


  function fonts () {
    return src('app/fonts/src/*.*')
      .pipe(plumber())
      .pipe(fonter({
        formats: ['woff', 'ttf']
      }))
      .pipe(src('app/fonts/*.ttf'))
      .pipe(ttf2woff2())
      .pipe(dest('app/fonts'))
  }

  function images() {
    const filter = svgFilter(['**/*', '!app/images/src/*.svg'], { restore: true });

    return src(['app/images/src/*.*', '!app/images/src'])
      .pipe(newer('app/images'))
      .pipe(filter)
      .pipe(avif({ quality: 50 }))

      .pipe(src('app/images/src/*.*'))
      .pipe(newer('app/images'))
      .pipe(webp())

      .pipe(filter.restore)
      .pipe(src('app/images/src/*.*'))
      .pipe(newer('app/images'))
      .pipe(imagemin())

      .pipe(dest('app/images'))
  }

  function sprite() {
    return src('app/images/*.svg')
      .pipe(svgSprite({
        mode: {
          stack: {
            sprite: '../sprite.svg',
            example: true
          }
        } 
      }))
      .pipe(dest('app/images'))
  }

  function scripts() {
    return src([
      'app/js/main.js'
      // 'app/js/*.js',
      // '!app/js/main.min.js',
    ])
      .pipe(concat('main.min.js'))
      .pipe(uglify())
      .pipe(dest('app/js'))
      .pipe(browserSync.stream())
  }

  function styles() {
    return src('app/scss/style.scss')
      .pipe(autoprefixer({
        overrideBrowserslist: ['last 10 versions'],
        grid: true,
      }))
      .pipe(concat('style.min.css'))
      .pipe(scss({ outputStyle: 'compressed' }))
      .pipe(dest('app/css'))
      .pipe(browserSync.stream())
  }

  function watching() {
    browserSync.init({
      server: {
        baseDir: "app/"
      },
      notify: false
    });
    watch(['app/scss/**/*.scss'], styles)
    watch(['app/images/src'], images)
    watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts)
    watch(['app/components/*', 'app/pages/*'], pages)
    watch(['app/*.html']).on('change', browserSync.reload)
  }

  // function browsersync() {

  // }

  function cleanDist() {
    return src('dist')
      .pipe(clean())
  }

  function building() {
    return src([
      'app/css/style.min.css',
      'app/images/*.*',
      '!app/images/*.svg',
      'app/images/sprite.svg',
      'app/fonts/*.*',
      'app/js/main.min.js',
      'app/pages/*.html'
    ], {base: 'app'})
      .pipe(dest('dist'))
  }

  exports.styles = styles;
  exports.images = images;
  exports.fonts = fonts;
  exports.pages = pages;
  exports.building = building;
  exports.sprite = sprite;
  exports.scripts = scripts;
  exports.watching = watching;
  // exports.browsersync = browsersync;

  exports.build = series(cleanDist, building);
  exports.default = parallel(styles, images, scripts, pages, watching);
