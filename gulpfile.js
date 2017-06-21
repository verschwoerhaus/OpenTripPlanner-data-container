const gulp = require('gulp');
const dl = require('./src/lib/Download');
const map = require('map-stream');
const exec = require('child_process').exec;
const {setFeedId, setFeedIdTask} = require('./src/lib/SetFeedId');
const {OBAFilter} = require('./src/lib/OBAFilter');
const {fitGTFS} = require('./src/lib/MapFit');
const request = require('request')
const {testGTFSFile} = require('./src/lib/GTFSTest')
var through = require('through2');

withIdUrlFit = (id,url,fit) => ({id,url,fit});

const HSL_CONFIG = {
  "id":"hsl",
  "src": [
    withIdUrlFit("HSL","http://dev.hsl.fi/gtfs/hsl.zip", true)
  ],
  "osm":"hsl.osm.pbf",
}

const FINLAND_CONFIG = {
  "id":"finland",
  "src": [
    withIdUrlFit("HSL","http://dev.hsl.fi/gtfs/hsl.zip", true),
    withIdUrlFit("MATKA","http://dev.hsl.fi/gtfs.matka/matka.zip", false),
    withIdUrlFit("tampere","http://data.itsfactory.fi/journeys/files/gtfs/latest/gtfs_tampere.zip", false),
    withIdUrlFit("jyvaskyla","http://data.jyvaskyla.fi/tiedostot/linkkidata.zip", false),
    withIdUrlFit("lautta","http://lautta.net/db/gtfs/gtfs.zip", false),
    withIdUrlFit("oulu",'http://www.transitdata.fi/oulu/google_transit.zip', false),
  ],
  "osm":"finland.osm.pbf",
}

const WALTTI_CONFIG = {

  "id":"waltti",
  "src": [
    withIdUrlFit("Hameenlinna","http://dev.hsl.fi/gtfs.waltti/hameenlinna.zip", false),
    withIdUrlFit("Kajaani","http://dev.hsl.fi/gtfs.waltti/kajaani.zip", false),
    withIdUrlFit("KeskiSuomenEly",'http://dev.hsl.fi/gtfs.waltti/keski-suomen_ely.zip', false),
    withIdUrlFit("Kotka",'http://dev.hsl.fi/gtfs.waltti/kotka.zip', false),
    withIdUrlFit("Kouvola",'http://dev.hsl.fi/gtfs.waltti/kvl.zip',false),
    withIdUrlFit("Lappeenranta",'http://dev.hsl.fi/gtfs.waltti/lappeenranta.zip',false),
    withIdUrlFit("Mikkeli",'http://dev.hsl.fi/gtfs.waltti/mikkeli.zip',false),
    withIdUrlFit("PohjoisPohjanmaanEly",'http://dev.hsl.fi/gtfs.waltti/pohjois-pohjanmaan_ely.zip',false),
    withIdUrlFit("IisalmiEly",'http://dev.hsl.fi/gtfs.waltti/posely_iisalmi.zip',false),
    withIdUrlFit("MikkeliEly",'http://dev.hsl.fi/gtfs.waltti/posely_mikkeli.zip',false),
    withIdUrlFit("Vaasa",'http://dev.hsl.fi/gtfs.waltti/vaasa.zip',false),
    withIdUrlFit("Joensuu", 'http://dev.hsl.fi/gtfs.waltti/joensuu.zip',false),
    withIdUrlFit("JoensuuEly", 'http://dev.hsl.fi/gtfs.waltti/posely_joensuu.zip',false),
    withIdUrlFit("FOLI", 'http://dev.hsl.fi/gtfs.foli/foli.zip', false),
    withIdUrlFit("Lahti", 'http://dev.hsl.fi/gtfs.lahti/lahti.zip', false),
    withIdUrlFit("Kuopio", 'http://dev.hsl.fi/gtfs.kuopio/kuopio.zip', false)
  ],
  "osm":"finland.osm.pbf",
}

const ALL_CONFIGS=[WALTTI_CONFIG, HSL_CONFIG, FINLAND_CONFIG];

const osm = [
  'http://dev.hsl.fi/osm.finland/finland.osm.pbf',
  'http://dev.hsl.fi/osm.hsl/hsl.osm.pbf'
];

gulp.task('download-osm', function () {
  osm.map(url => request
  .get(url)
  .on('error', function(err) {
    console.log(err)
  })
  .pipe(gulp.dest("downloads/osm")));
});

gulp.task('waltti', function() {
  //copy & zip router content
  //prebuild routing graph
  //build and deploy container
});

/**
 * Update gtfs data:
 * 1. download
 * 2. name zip as <id>.zip (in dir download)
 * 3. test zip loads with OpenTripPlanner
 * 4. add feedid
 * 5. copy to stage dir
 */
gulp.task('update-gtfs', function () {
  const urlEntry = {}
  ALL_CONFIGS.map(cfg => cfg.src).reduce((acc,val) => acc.concat(val), []).forEach(
    (entry)=>{
      if(urlEntry[entry.url]===undefined) {
          urlEntry[entry.url] = entry;
      }
    }
  );

  const files = Object.keys(urlEntry).map(key=>urlEntry[key]);

  return dl(files, true, true)
    .pipe(gulp.dest("downloads/gtfs"))
    .pipe(testGTFSFile())
    .pipe(gulp.dest("stage/gtfs"))
    .pipe(setFeedIdTask());
});

/**
 * Seed GTFS & OSM data with data from previous data-containes to allow
 * continuous flow of data into production
 */
 gulp.task('seed-data', function () {
   ALL_CONFIGS.forEach(c => {

     console.log(c.id);
   });
 });

/**
 * Sets feed id to gtfs
 */
const setId = function(file, id, cb) {
  const fileName=file.history[file.history.length-1];
  setFeedId(fileName, id, cb);
};

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
