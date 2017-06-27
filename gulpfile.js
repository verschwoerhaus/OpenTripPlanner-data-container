const gulp = require('gulp');
const dl = require('./task/Download');
const {setFeedIdTask} = require('./task/SetFeedId');
const {OBAFilterTask} = require('./task/OBAFilter');
const {fitGTFSTask} = require('./task/MapFit');
const {testGTFSFile} = require('./task/GTFSTest');
const Seed = require('./task/Seed');
const prepareRouterData = require('./task/prepareRouterData');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const config = require('./config');
const {buildOTPGraphTask} = require('./task/buildOTPGraph');

/**
 * Download and test new osm data
 */
gulp.task('osm:update', function () {
  const osmMap = config.ALL_CONFIGS.map(cfg => cfg.osm).reduce((acc, val) => {acc[val] = true; return acc;},{});
  const urls = Object.keys(osmMap).map(key => config.osmMap[key]);
  return dl(urls, true, true)
    .pipe(gulp.dest('downloads/osm'))
    .pipe(testGTFSFile())
    .pipe(gulp.dest('ready/osm'));
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
  config.ALL_CONFIGS.map(cfg => cfg.src).reduce((acc,val) => acc.concat(val), []).forEach(
    (entry) => {
      if(urlEntry[entry.url]===undefined) {
        urlEntry[entry.url] = entry;
      }
    }
  );

  const files = Object.keys(urlEntry).map(key => urlEntry[key]);

  return dl(files, true, true)
    .pipe(gulp.dest('downloads/gtfs'))
    .pipe(testGTFSFile())
    .pipe(vinylPaths(del))
    .pipe(gulp.dest('id/gtfs'));
});

//Add feedId to gtfs files in id dir, and moves files to directory 'fit'
gulp.task('gtfs:id', ['del:fit'], function(){
  return gulp.src(['id/gtfs/*'])
    .pipe(setFeedIdTask())
    .pipe(vinylPaths(del))
    .pipe(gulp.dest('fit/gtfs'));
});

//Run MapFit on gtfs files (based on config) and moves files to directory
//'filter'
gulp.task('gtfs:fit', ['del:filter'], function(){
  return gulp.src(['fit/gtfs/*'])
    .pipe(fitGTFSTask(config.configMap))
    //.pipe(vinylPaths(del))
    .pipe(gulp.dest('filter/gtfs'));
});

//Run one of more filter runs on gtfs files(based on config) and moves files to
//directory 'ready'
gulp.task('gtfs:filter', function(){
  return gulp.src(['filter/gtfs/*'])
    .pipe(OBAFilterTask(config.configMap))
    //.pipe(vinylPaths(del))
    .pipe(gulp.dest('ready/gtfs'));
});

gulp.task('del:ready', () => (del(['ready'])));

gulp.task('del:filter', () => (del(['filter'])));

gulp.task('del:fit', () => (del(['fit'])));

gulp.task('del:id', () => (del(['id'])));

gulp.task('gtfs:del', () => (del([
  'ready/gtfs'])));

gulp.task('gtfs:seed', ['gtfs:del'], function () {
  return Seed(config.ALL_CONFIGS,/\.zip/).pipe(gulp.dest('ready/gtfs'));
});

gulp.task('osm:del', () => (del([
  'ready/osm'])));

gulp.task('osm:seed', ['osm:del'], function () {
  return Seed(config.ALL_CONFIGS,/.pbf/).pipe(gulp.dest('ready/osm'));
});

gulp.task('router:copy', function () {
  return prepareRouterData(config.ALL_CONFIGS).pipe(gulp.dest('build'));
});

 /**
  * Seed GTFS & OSM data with data from previous data-containes to allow
  * continuous flow of data into production when one or more updated data files
  * are broken.
  */
gulp.task('seed', ['osm:seed','gtfs:seed']);

gulp.task('router:buildGraph', function(){
  gulp.src(['otp-data-container/*'])
    .pipe(gulp.dest('build/waltti'))
    .pipe(gulp.dest('build/finland'))
    .pipe(gulp.dest('build/hsl'));
  return buildOTPGraphTask(config.ALL_CONFIGS);
});

//do all
gulp.task('default', ['seed', 'osm:update', 'gtfs:update', 'router:copy','router:build']);
gulp.task('hsl', function(){
  /*


    unzip -o hsl.zip stop_times.txt
    # TODO: Check that the line is in expected format
    # Needed in order to get rid of "shape_distance_travelled"
    # this field is not currently available in shapes.txt. OpenTripPlanner needs it to be.
    cut --complement -f 9 -d, stop_times.txt > stop_times.new
    mv stop_times.new stop_times.txt
    zip -f hsl.zip stop_times.txt
    rm stop_times.txt

    # Note! we use finland OSM graph
    echo "Note! Next mapfit requires lot of memory. If it fails mysteriously, try adding more."
    set +e
    $FIT_GTFS $ROUTER_FINLAND/finland-latest.osm.pbf +init=epsg:3067 hsl.zip hsl_fitted.zip &> hsl.fit.log.txt
    RESULT=$?
    if [ $RESULT -ne 0 ]; then
        echo "GTFS fit failed"
        tail -100 hsl.fit.log.txt
        exit 1
    fi
    set -e
    echo "HSL mapfit ready."
    mv hsl_fitted.zip hsl.zip
    add_feed_id hsl.zip HSL
    # HSL data is also needed in national graph
    cp hsl.zip $ROUTER_FINLAND
  */
});
