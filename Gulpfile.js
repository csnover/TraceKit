/* jshint esversion: 6 */
/* jshint node: true */
const gulp = require('gulp');
const Server = require('karma').Server;
const jshint = require('gulp-jshint');
const bump = require('gulp-bump');

const srcCode = ['./tracekit.js'];
/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js'
    }, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tddchrome', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.chrome.js'
    }, done).start();
});

// We do this over using include/exclude to make everything feel gulp-like!
gulp.task('doc', function (cb) {
    let jsdoc = require('gulp-jsdoc3');

    let config = require('./jsdoc.conf.json');
    gulp.src(['README.md'].concat(srcCode), {
            read: false
        })
        .pipe(jsdoc(config, cb));
});


gulp.task('lint', function () {
    return gulp.src(['./tracekit.js', './Gulpfile.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});


// Update bower, component, npm at once:
gulp.task('bump', function () {
    gulp.src(['package.json', 'bower.json', 'appveyor.yml'])
        .pipe(bump({
            type: 'patch'
        }))
        .pipe(gulp.dest('./'));
});


// Update bower, component, npm at once:
gulp.task('bump-minor', function () {
    gulp.src(['package.json', 'bower.json', 'appveyor.yml'])
        .pipe(bump({
            type: 'minor'
        }))
        .pipe(gulp.dest('./'));
});
