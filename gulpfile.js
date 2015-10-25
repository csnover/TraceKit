var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var karma = require('gulp-karma');
var package = require('./package.json');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var tslint = require('gulp-tslint');
var tsProject = require('tsproject');
var uglify = require('gulp-uglify');
var umd = require('gulp-wrap-umd');

gulp.task('clean', function () {
  del.sync(['dist'], { force: true });
});

gulp.task('typescript', function() {
  return tsProject.src('src/tsconfig.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('typescript.integrations', ['typescript'], function() {
  return tsProject.src('src/integrations/tsconfig.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('typescript.build', ['typescript', 'typescript.integrations'], function() {
  gulp.src('dist/temp/src/tracekit.d.ts')
    .pipe(gulp.dest('dist'));

  var integrations = [
    'dist/temp/src/integrations/window.js'
  ];

  gulp.src(integrations)
    .pipe(gulp.dest('dist/integrations'));

  var files = ['dist/temp/tracekit.js'];
  gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('tracekit.js'))
    .pipe(replace('tracekit-js/1.0.0.0', 'tracekit-js/' + package.version))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('tracekit.min.js'))
    .pipe(replace('tracekit-js/1.0.0.0', 'tracekit-js/' + package.version))
    .pipe(uglify({ output: { beautify: false }}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
});

gulp.task('watch', ['build'], function() {
  gulp.watch('src/**/*.ts', ['build']);
});

gulp.task('lint', function() {
  return gulp.src(['src/**/*.ts', '!src/typings/**/*.ts'])
    .pipe(tslint())
    .pipe(tslint.report('verbose'));
});

gulp.task('build', ['clean', 'lint', 'typescript.build']);

gulp.task('typescript.test', function() {
  return tsProject.src('src/tsconfig.test.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('test', ['typescript.test'], function() {
  return gulp.src(['dist/temp/tracekit-spec.js'])
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function(err) {
     console.log('karma tests failed: ' + err);
     throw err;
    });
});

gulp.task('default', ['watch', 'build', 'test']);
