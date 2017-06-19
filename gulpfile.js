const gulp = require('gulp');
const dl = require('gulp-download');
const map = require('map-stream');
const exec = require('child_process').exec;
const {setFeedId} = require('./src/lib/SetFeedId');
const {OBAFilter} = require('./src/lib/OBAFilter');
const {fitGTFS} = require('./src/lib/MapFit');


const HSL_CONFIG = {
  "config":"router-hsl",
  "src": [
    {
      "id":"HSL",
      "url":"http://daev.hsl.fi/gtfs/hsl.zip",
      "fit": true
    }
  ],
  "osm":"hsl.osm.pbf",
}

const fileIdExceptions = {
  'http://data.itsfactory.fi/journeys/files/gtfs/latest/gtfs_tampere.zip':'tampere',
  'http://data.jyvaskyla.fi/tiedostot/linkkidata.zip':'jyvaskyla',
  'http://lautta.net/db/gtfs/gtfs.zip':'lautta',
  'http://www.transitdata.fi/oulu/google_transit.zip':'oulu'
}

const finland_gtfs = [
  'http://data.itsfactory.fi/journeys/files/gtfs/latest/gtfs_tampere.zip',
  'http://dev.hsl.fi/gtfs/hsl.zip',
  'http://data.jyvaskyla.fi/tiedostot/linkkidata.zip',
  'http://www.transitdata.fi/oulu/google_transit.zip',
  'http://lautta.net/db/gtfs/gtfs.zip',
  'http://dev.hsl.fi/gtfs.matka/matka.zip'];

const waltti_gtfs = [
  'http://dev.hsl.fi/gtfs.waltti/hameenlinna.zip',
  'http://dev.hsl.fi/gtfs.waltti/kajaani.zip',
  'http://dev.hsl.fi/gtfs.waltti/keski-suomen_ely.zip',
  'http://dev.hsl.fi/gtfs.waltti/kotka.zip',
  'http://dev.hsl.fi/gtfs.waltti/kvl.zip',
  'http://dev.hsl.fi/gtfs.waltti/lappeenranta.zip',
  'http://dev.hsl.fi/gtfs.waltti/mikkeli.zip',
  'http://dev.hsl.fi/gtfs.waltti/pohjois-pohjanmaan_ely.zip',
  'http://dev.hsl.fi/gtfs.waltti/posely_iisalmi.zip',
  'http://dev.hsl.fi/gtfs.waltti/posely_mikkeli.zip',
  'http://dev.hsl.fi/gtfs.waltti/vaasa.zip',
  'http://dev.hsl.fi/gtfs.waltti/joensuu.zip',
  'http://dev.hsl.fi/gtfs.waltti/posely_joensuu.zip'
];

const osm = [
  'http://dev.hsl.fi/osm.finland/finland.osm.pbf',
  'http://dev.hsl.fi/osm.hsl/hsl.osm.pbf'
];

gulp.task('download-osm', function () {
  return dl(osm, true).pipe(gulp.dest("downloads/osm"));
});

gulp.task('download-gtfs', function () {
  const files = HSL_CONFIG.src.map(src=>src.url).concat(finland_gtfs).concat(waltti_gtfs).reduce(
    function(res,url){
        if(res.indexOf(url)==-1) {
          res.push(url);
        }
        return res;
    },[])
    return dl(files, true, true).pipe(gulp.dest("downloads/gtfs"));
});

gulp.task('stage', function() {
  return gulp.src(['downloads/**/'])
   .pipe(gulp.dest('staging'));
});

gulp.task('processed', function() {
  return gulp.src(['staging/**/'])
   .pipe(gulp.dest('processed'));
});

/**
 * Sets feed id to gtfs
 */
cost setId = function(file, id, cb) {
  const fileName=file.history[file.history.length-1];
  setFeedId(fileName, id, cb);
};

gulp.task('set-feed-id', function() {
  return gulp.src(["processed/gtfs/*"],{read:false}).pipe(map(setId));
});

gulp.task('filter-data', function() {
  return OBAFilter("processed/gtfs/hsl.zip" );
});

gulp.task('map-fit', function() {
  return fitGTFS("processed/osm/finland.osm.pbf","processed/gtfs/hsl.zip", "processed/gtfs/hsl-fitted.zip");
});

gulp.task('hsl', function(){
  return gulp.src(["processed/gtfs/*"],{read:false}).pipe(map(setId));
  /*
  return setFeedId(CONFIG)
    .then()
    .then(fit)

    .then(zip);
    .then(build);

    echo "Retrieving HSL data..."
    cd $ROUTER_HSL
    curl -sS -z hsl.zip "http://dev.hsl.fi/gtfs/hsl.zip" -o hsl.zip

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
})
