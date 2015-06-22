var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');

gulp.task('less', function () {
  return gulp.src('./http/www/themes/banquet/master.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./http/www/themes/banquet/'));
});

gulp.task('default', function() {
  // place code for your default task here
});
