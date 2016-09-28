var gulp = require('gulp');
var exec = require('child_process').exec;
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var notifier = require('node-notifier');
var notify = require('gulp-notify');
var rename = require('gulp-rename');

// Tasks
gulp.task('default', ['watch', 'build']);


// Watch
gulp.task('watch', function() {
	var target = 'src/*.js';
	return gulp.watch('./src/*.js', ['build']);
});

gulp.task('build', ['jshint'], function () {
	return gulp.src('./src/*.js')
	.pipe(uglify({ preserveComments : 'license' }))
	.on('error', notify.onError(function (error) {
		return 'Error: ' + error.message;
	}))
	.pipe(rename({ suffix : '.min' }))
	.pipe(gulp.dest('./build'));
})

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
	var cmd = 'rm -rf ./build';
	exec(cmd);
	return gulp;
});