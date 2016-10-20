var gulp = require('gulp');
var exec = require('child_process').exec;
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var notifier = require('node-notifier');
var notify = require('gulp-notify');
var rename = require('gulp-rename');


var scriptName = 'tm.applepay.js';

// Tasks
gulp.task('default', ['watch', 'build']);


// Watch
gulp.task('watch', function() {
	var target = 'src/*.js';
	return gulp.watch('./src/*.js', ['build']);
});

gulp.task('build', ['copy'], function () {
	return gulp.src('./src/*.js')// + scriptName)
	.pipe(uglify({ preserveComments : 'license' }))
	.on('error', notify.onError(function (error) {
		return 'Error: ' + error.message;
	}))
	.pipe(rename({ suffix : '.min' }))
	.pipe(gulp.dest('./lib'));
});
gulp.task('copy', ['jshint'], function () {
	return gulp.src('./src/*.js')
	.pipe(gulp.dest('./lib'));
});

// Jshint
gulp.task('jshint', function () {
	return gulp.src('./src/*.js')
	.pipe(jshint())
	.pipe(notify(function (file) {
		if (file.jshint.success) {
			// Don't show something if success
			return false;
		}
		
		var errors = file.jshint.results.map(function (data) {
			if (data.error) {
				return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
			}
		}).join("\n");
		
		return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
	}));
});

gulp.task('clean', function () {
	var cmd = 'rm -rf ./lib';
	exec(cmd);
	return gulp;
});