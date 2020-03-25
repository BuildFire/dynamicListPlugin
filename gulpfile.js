const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const minHTML = require('gulp-htmlmin');
const minifyCSS = require('gulp-csso');
const imagemin = require('gulp-imagemin');
const gulpSequence = require('gulp-sequence');

const jsTasks=[
  {name: "widgetJS", src: "widget/**/*.js"},
  {name: "controlContentJS", src: "control/content/**/*.js"},
  {name: "controlDesignJS", src: "control/design/**/*.js"},
  {name: "controlAbuseJS", src: "control/abuse/**/*.js"},
  {name: "controlTestJS", src: "control/tests/**/*.js"},
  {name: "controlSettingsJS", src: "control/settings/**/*.js"}
];

const htmlTasks=[
  {name: "widgetHtml", src: "widget/**/*.html"},
  {name: "controlContentHtml", src: "control/content/**/*.html"},
  {name: "controlDesignHtml", src: "control/design/**/*.html"},
  {name: "controlAbuseHtml", src: "control/abuse/**/*.html"},
  {name: "controlTestHtml", src: "control/tests/**/*.html"},
  {name: "controlSettingsHtml", src: "control/settings/**/*.html"}
];

const cssTasks=[
  {name: "widgetCss", src: "widget/**/*.css"},
  {name: "controlContentCss", src: "control/content/**/*.css"},
  {name: "controlDesignCss", src: "control/design/**/*.css"},
  {name: "controlAbuseCss", src: "control/abuse/**/*.css"},
  {name: "controlTestCss", src: "control/tests/**/*.css"},
  {name: "controlSettingsCss", src: "control/settings/**/*.css"}
];


jsTasks.forEach((task) => {
  gulp.task(task.name, function () {
    return gulp.src(task.src, {
        base: '.'
      })
      .pipe(babel({
        presets: ["@babel/preset-env"]
      }))
      .pipe(uglify())
      .pipe(gulp.dest('dist'));
  });

})


htmlTasks.forEach((task) => {
  gulp.task(task.name, function () {
    return gulp.src(task.src, {base: '.'})
      .pipe(minHTML({
        removeComments: true,
        collapseWhitespace: true
      }))
      .pipe(gulp.dest('dist'));
  });
})

cssTasks.forEach((task) => {
  gulp.task(task.name, function () {
    return gulp.src(task.src, {
        base: '.'
      })
      .pipe(minifyCSS())
      .pipe(gulp.dest('dist'));
  });
})

// gulp.task('js', () => {
//   return gulp.src("widget/**/*.js", {
//       base: '.'
//     })
//     .pipe(babel({
//       presets: ["@babel/preset-env"]
//     }))
//     .pipe(uglify())
//     .pipe(gulp.dest('dist'));
// });

// gulp.task('css', () => {
//   return gulp.src('widget/**/*.css', {
//       base: '.'
//     })
//     .pipe(minifyCSS())
//     .pipe(gulp.dest('dist'));
// });

// gulp.task('html', function () {
//   return gulp.src(['widget/**/*.html'], {base: '.'})
//     .pipe(minHTML({
//       removeComments: true,
//       collapseWhitespace: true
//     }))
//     .pipe(gulp.dest('dist'));
// });

gulp.task('resources', function () {
  return gulp.src(['resources/*', 'plugin.json'], {base: '.'})
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src(['**/.images/**'], {base: '.'})
    .pipe(imagemin())
    .pipe(gulp.dest('dist'));
});


let buildTasksToRun = ['resources','images'];

jsTasks.forEach((task) => {  buildTasksToRun.push(task.name)});
htmlTasks.forEach((task) => {  buildTasksToRun.push(task.name)});
cssTasks.forEach((task) => {  buildTasksToRun.push(task.name)});

gulp.task('build',  gulpSequence('', '', buildTasksToRun));
