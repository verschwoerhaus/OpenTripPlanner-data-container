const fs = require('fs');
const {execSync}= require('child_process');
const gulp = require('gulp');
const col = require('ansi-colors');
const dl = require('./task/Download');
const dlBlob = require('./task/DownloadDEMBlob');
const {setFeedIdTask} = require('./task/setFeedId');
const {OBAFilterTask} = require('./task/OBAFilter');
const {fitGTFSTask} = require('./task/MapFit');
const {testGTFSFile} = require('./task/GTFSTest');
const Seed = require('./task/Seed');
const prepareRouterData = require('./task/prepareRouterData');
const del = require('del');
const config = require('./config');
const {buildOTPGraphTask} = require('./task/buildOTPGraph');
const hslHackTask= require('./task/hslHackTask');
const {postSlackMessage} = require('./util');

/**
 * Download and test new osm data
 */
gulp.task('osm:update', function () {
  const map = config.ALL_CONFIGS().map(cfg => cfg.osm).concat('finland').reduce((acc, val) => {acc[val] = true; return acc;},{});
  const urls = Object.keys(map).map(key => config.osmMap[key]);
  return dl(urls, true, true)
    .pipe(gulp.dest(`${config.dataDir}/downloads/osm`))
    .pipe(testGTFSFile())
    .pipe(gulp.dest(`${config.dataDir}/ready/osm`));
});

/**
 * Download and test new dem data
 */
gulp.task('dem:update', function () {
  const map = config.ALL_CONFIGS().map(cfg => cfg.dem).reduce((acc, val) => {acc[val] = true; return acc;},{});
  const urls = Object.keys(map).map(key => config.demMap[key]).filter((url) => (url !== undefined));
  const demDownloadDir = `${config.dataDir}/downloads/dem/`;
  if (!fs.existsSync(demDownloadDir)) {
    execSync(`mkdir -p ${demDownloadDir}`);
  }
  const demReadyDir = `${config.dataDir}/ready/dem/`;
  if (!fs.existsSync(demReadyDir)) {
    execSync(`mkdir -p ${demReadyDir}`);
  }
  const promises = dlBlob(urls, true, true);
  return Promise.all(promises)
    .catch((err) => {
      if (err === 'fail') {
        process.stdout.write(col.red("Failing build because of a failed DEM download!\n"));
        postSlackMessage(`Failing build because of a failed DEM download.`);
        process.exit(1);
      }
    });
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
  config.ALL_CONFIGS().map(cfg => cfg.src).reduce((acc,val) => acc.concat(val), []).forEach(
    (entry) => {
      if(urlEntry[entry.url]===undefined) {
        urlEntry[entry.url] = entry;
      }
    }
  );

  const files = Object.keys(urlEntry).map(key => urlEntry[key]);

  return dl(files, true, true)
    .pipe(gulp.dest(`${config.dataDir}/downloads/gtfs`))
  //    .pipe(vinylPaths(del))
    .pipe(testGTFSFile())
    .pipe(gulp.dest(`${config.dataDir}/fit/gtfs`));
});

//Add feedId to gtfs files in id dir, and moves files to directory 'fit'
gulp.task('gtfs:id', function(){
  return gulp.src([`${config.dataDir}/id/gtfs/*`])
    .pipe(setFeedIdTask())
  //    .pipe(vinylPaths(del))
    .pipe(gulp.dest(`${config.dataDir}/ready/gtfs`));
});

//Run MapFit on gtfs files (based on config) and moves files to directory
//'filter'
gulp.task('gtfs:fit', ['del:filter', 'hslHack'], function(){
  return gulp.src([`${config.dataDir}/fit/gtfs/*`])
    .pipe(fitGTFSTask(config.configMap))
    //.pipe(vinylPaths(del))
    .pipe(gulp.dest(`${config.dataDir}/filter/gtfs`));
});

gulp.task('hslHack', function(){
  return hslHackTask();
});

gulp.task('copyRouterConfig', function(){
  return gulp.src(['router-*/**']).pipe(
    gulp.dest(config.dataDir));
});

//Run one of more filter runs on gtfs files(based on config) and moves files to
//directory 'ready'
gulp.task('gtfs:filter', ['copyRouterConfig'], function(){
  return gulp.src([`${config.dataDir}/filter/gtfs/*`])
    .pipe(OBAFilterTask(config.configMap))
    //.pipe(vinylPaths(del))
    .pipe(gulp.dest(`${config.dataDir}/id/gtfs`));
});

gulp.task('del:ready', () => (del([`${config.dataDir}/ready`])));

gulp.task('del:filter', () => (del([`${config.dataDir}/filter`])));

gulp.task('del:fit', () => (del([`${config.dataDir}/fit`])));

gulp.task('del:id', () => (del([`${config.dataDir}/id`])));

gulp.task('gtfs:del', () => (del([
  `${config.dataDir}/ready/gtfs`])));

gulp.task('gtfs:seed', ['gtfs:del'], function () {
  return Seed(config.ALL_CONFIGS(),/\.zip/).pipe(gulp.dest(`${config.dataDir}/ready/gtfs`));
});

gulp.task('osm:del', () => (del([
  `${config.dataDir}/ready/osm`])));

gulp.task('osm:seed', ['osm:del'], function () {
  return Seed(config.ALL_CONFIGS(),/.pbf/).pipe(gulp.dest(`${config.dataDir}/ready/osm`));
});

/**
 * Seed GTFS & OSM data with data from previous data-containes to allow
 * continuous flow of data into production when one or more updated data files
 * are broken.
 */
gulp.task('seed', ['osm:seed','gtfs:seed']);

gulp.task('router:del',() => (del([
  `${config.dataDir}/build`])));

gulp.task('router:copy', ['router:del'], function () {
  return prepareRouterData(config.ALL_CONFIGS()).pipe(gulp.dest(`${config.dataDir}/build`));
});

gulp.task('router:buildGraph', ['router:copy'], function(){
  gulp.src(['otp-data-container/*','otp-data-container/.*'])
    .pipe(gulp.dest(`${config.dataDir}/build/waltti`))
    .pipe(gulp.dest(`${config.dataDir}/build/finland`))
    .pipe(gulp.dest(`${config.dataDir}/build/hsl`));
  return buildOTPGraphTask(config.ALL_CONFIGS());
});
