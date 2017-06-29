const gulp = require('gulp');
const dl = require('./task/Download');
const {setFeedIdTask} = require('./task/setFeedId');
const {OBAFilterTask} = require('./task/OBAFilter');
const {fitGTFSTask} = require('./task/MapFit');
const {testGTFSFile} = require('./task/GTFSTest');
const Seed = require('./task/Seed');
const prepareRouterData = require('./task/prepareRouterData');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const {configMap, osmMap, ALL_CONFIGS, dataDir} = require('./config');
const {buildOTPGraphTask} = require('./task/buildOTPGraph');
const hslHackTask= require('./task/hslHackTask');

/**
 * Download and test new osm data
 */
gulp.task('osm:update', function () {
  const map = ALL_CONFIGS.map(cfg => cfg.osm).concat('finland').reduce((acc, val) => {acc[val] = true; return acc;},{});
  const urls = Object.keys(map).map(key => osmMap[key]);
  return dl(urls, true, true)
    .pipe(gulp.dest(`${dataDir}/downloads/osm`))
    .pipe(testGTFSFile())
    .pipe(gulp.dest(`${dataDir}/ready/osm`));
});

/**
 * download and test new gtfs data:
 * clear download & stage dir
 * 1. download
 * 2. name zip as <id>.zip (in dir download)
 * 3. test zip loads with OpenTripPlanner
 * 4. copy to id dir if test is succesful
 */
gulp.task('gtfs:dl', ['del:id'],function () {
  const urlEntry = {};
  ALL_CONFIGS.map(cfg => cfg.src).reduce((acc,val) => acc.concat(val), []).forEach(
    (entry) => {
      if(urlEntry[entry.url]===undefined) {
        urlEntry[entry.url] = entry;
      }
    }
  );

  const files = Object.keys(urlEntry).map(key => urlEntry[key]);

  return dl(files, true, true)
    .pipe(gulp.dest(`${dataDir}/downloads/gtfs`))
//    .pipe(vinylPaths(del))
    .pipe(testGTFSFile())
    .pipe(gulp.dest(`${dataDir}/id/gtfs`));
});

//Add feedId to gtfs files in id dir, and moves files to directory 'fit'
gulp.task('gtfs:id', ['del:fit'], function(){
  return gulp.src([`${dataDir}/id/gtfs/*`])
    .pipe(setFeedIdTask())
//    .pipe(vinylPaths(del))
    .pipe(gulp.dest(`${dataDir}/fit/gtfs`));
});

//Run MapFit on gtfs files (based on config) and moves files to directory
//'filter'
gulp.task('gtfs:fit', ['del:filter', 'hslHack'], function(){
  return gulp.src([`${dataDir}/fit/gtfs/*`])
    .pipe(fitGTFSTask(configMap))
    //.pipe(vinylPaths(del))
    .pipe(gulp.dest(`${dataDir}/filter/gtfs`));
});

gulp.task('hslHack', function(){
  return hslHackTask();
});

gulp.task('copyRouterConfig', function(){
  return gulp.src(['router-*/**']).pipe(
    gulp.dest(`${dataDir}`));
});

//Run one of more filter runs on gtfs files(based on config) and moves files to
//directory 'ready'
gulp.task('gtfs:filter', ['copyRouterConfig'], function(){
  return gulp.src([`${dataDir}/filter/gtfs/*`])
    .pipe(OBAFilterTask(configMap))
    //.pipe(vinylPaths(del))
    .pipe(gulp.dest(`${dataDir}/ready/gtfs`));
});

gulp.task('del:ready', () => (del([`${dataDir}/ready`])));

gulp.task('del:filter', () => (del([`${dataDir}/filter`])));

gulp.task('del:fit', () => (del([`${dataDir}/fit`])));

gulp.task('del:id', () => (del([`${dataDir}/id`])));

gulp.task('gtfs:del', () => (del([
  `${dataDir}/ready/gtfs`])));

gulp.task('gtfs:seed', ['gtfs:del'], function () {
  return Seed(ALL_CONFIGS,/\.zip/).pipe(gulp.dest(`${dataDir}/ready/gtfs`));
});

gulp.task('osm:del', () => (del([
  `${dataDir}/ready/osm`])));

gulp.task('osm:seed', ['osm:del'], function () {
  return Seed(ALL_CONFIGS,/.pbf/).pipe(gulp.dest(`${dataDir}/ready/osm`));
});

/**
 * Seed GTFS & OSM data with data from previous data-containes to allow
 * continuous flow of data into production when one or more updated data files
 * are broken.
 */
gulp.task('seed', ['osm:seed','gtfs:seed']);

gulp.task('router:del',() => (del([
  `${dataDir}/build`])));

gulp.task('router:copy', ['router:del'], function () {
  return prepareRouterData(ALL_CONFIGS).pipe(gulp.dest(`${dataDir}/build`));
});

gulp.task('router:buildGraph', ['router:copy'], function(){
  gulp.src(['otp-data-container/*','otp-data-container/.*'])
    .pipe(gulp.dest(`${dataDir}/build/waltti`))
    .pipe(gulp.dest(`${dataDir}/build/finland`))
    .pipe(gulp.dest(`${dataDir}/build/hsl`));
  return buildOTPGraphTask(ALL_CONFIGS);
});
