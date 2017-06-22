const gulp = require('gulp');
const dl = require('./src/lib/Download');
const map = require('map-stream');
const exec = require('child_process').exec;
const {setFeedIdTask} = require('./src/lib/SetFeedId');
const {OBAFilterTask} = require('./src/lib/OBAFilter');
const {fitGTFSTask} = require('./src/lib/MapFit');
const request = require('request')
const {testGTFSFile} = require('./src/lib/GTFSTest')
const Seed = require("./src/lib/Seed");
const through = require('through2');
const del = require('del');
const vinylPaths = require('vinyl-paths');

/*
 * id = feedid (String)
 * url = feed url (String)
 * fit = mapfit shapes (true/false)
 * rules = OBA Filter rules to apply (array of strings)
 */
src = (id,url,fit,rules) => ({id,url,fit,rules});

const HSL_CONFIG = {
  "id":"hsl",
  "src": [
    src("HSL","http://dev.hsl.fi/gtfs/hsl.zip", true)
  ],
  "osm":"hsl.osm.pbf",
}

const FINLAND_CONFIG = {
  "id":"finland",
  "src": [
    src("HSL","http://dev.hsl.fi/gtfs/hsl.zip", true),
    src("MATKA","http://dev.hsl.fi/gtfs.matka/matka.zip", true),
    src("tampere","http://data.itsfactory.fi/journeys/files/gtfs/latest/gtfs_tampere.zip", true),
    src("jyvaskyla","http://data.jyvaskyla.fi/tiedostot/linkkidata.zip", false),
    src("lautta","http://lautta.net/db/gtfs/gtfs.zip", false),
    src("oulu",'http://www.transitdata.fi/oulu/google_transit.zip', false),
  ],
  "osm":"finland.osm.pbf",
}

const WALTTI_CONFIG = {

  "id":"waltti",
  "src": [
    src("Hameenlinna","http://dev.hsl.fi/gtfs.waltti/hameenlinna.zip", false),
    src("Kajaani","http://dev.hsl.fi/gtfs.waltti/kajaani.zip", false),
    src("KeskiSuomenEly",'http://dev.hsl.fi/gtfs.waltti/keski-suomen_ely.zip', false),
    src("Kotka",'http://dev.hsl.fi/gtfs.waltti/kotka.zip', false),
    src("Kouvola",'http://dev.hsl.fi/gtfs.waltti/kvl.zip',false),
    src("Lappeenranta",'http://dev.hsl.fi/gtfs.waltti/lappeenranta.zip',false),
    src("Mikkeli",'http://dev.hsl.fi/gtfs.waltti/mikkeli.zip',false),
    src("PohjoisPohjanmaanEly",'http://dev.hsl.fi/gtfs.waltti/pohjois-pohjanmaan_ely.zip',false),
    src("IisalmiEly",'http://dev.hsl.fi/gtfs.waltti/posely_iisalmi.zip',false),
    src("MikkeliEly",'http://dev.hsl.fi/gtfs.waltti/posely_mikkeli.zip',false),
    src("Vaasa",'http://dev.hsl.fi/gtfs.waltti/vaasa.zip',false),
    src("Joensuu", 'http://dev.hsl.fi/gtfs.waltti/joensuu.zip',false, ['router-waltti/gtfs-rules/waltti.rule']),
    src("JoensuuEly", 'http://dev.hsl.fi/gtfs.waltti/posely_joensuu.zip',false),
    src("FOLI", 'http://dev.hsl.fi/gtfs.foli/foli.zip', false),
    src("Lahti", 'http://dev.hsl.fi/gtfs.lahti/lahti.zip', false),
    src("Kuopio", 'http://dev.hsl.fi/gtfs.kuopio/kuopio.zip', false)
  ],
  "osm":"finland.osm.pbf",
}

const ALL_CONFIGS=[WALTTI_CONFIG, HSL_CONFIG, FINLAND_CONFIG].reduce((acc,nxt)=>{
  if(process.env.ROUTER) {
    if(process.env.ROUTER.split(',').indexOf(nxt.id)!=-1) {
      acc.push(nxt);
    }
  }
  return acc;
},[]);

//add config to every source
ALL_CONFIGS.forEach(cfg => cfg.src.forEach(src=>src.config=cfg));

// create id->src-entry map
const configMap=ALL_CONFIGS.map(cfg => cfg.src)
  .reduce((acc, val) => acc.concat(val), [])
  .reduce((acc, val) => {
    if(acc[val.id]===undefined) {
      acc[val.id] = val
    }
    return acc;
  },{})

const osm = [
  'http://dev.hsl.fi/osm.finland/finland.osm.pbf',
  'http://dev.hsl.fi/osm.hsl/hsl.osm.pbf'
];

gulp.task('update-osm', function () {
  osm.map(url => request
  .get(url)
  .on('error', function(err) {
    console.log(err)
  })
  .pipe(gulp.dest("downloads/osm"))
  .pipe(testGTFSFile())
    );
});

/**
 * download new gtfs data:
 * clear download & stage dir
 * 1. download
 * 2. name zip as <id>.zip (in dir download)
 * 3. test zip loads with OpenTripPlanner
 * 4. copy to id dir if test is succesful
 */
gulp.task('gtfs:dl', function () {
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
    .pipe(vinylPaths(del))
    .pipe(gulp.dest("id/gtfs"))
});

//Add feedId to gtfs files in id dir, and moves files to fit dir
gulp.task('gtfs:id', function(){
  return gulp.src(["id/gtfs/*"])
    .pipe(setFeedIdTask())
    //.pipe(vinylPaths(del))
    .pipe(gulp.dest("fit/gtfs"))
});

//Run MapFit on gtfs files (based on config) and moves files to filter dir
gulp.task('gtfs:fit', function(){
  return gulp.src(["fit/gtfs/*"])
    .pipe(fitGTFSTask(configMap))
    .pipe(vinylPaths(del))
    .pipe(gulp.dest("filter/gtfs"))
});

//Run one of more filter runs on gtfs files(based on config) and moves files to ready dir
gulp.task('gtfs:filter', function(){
  return gulp.src(["fit/gtfs/*"])
    .pipe(OBAFilterTask(configMap))
    .pipe(vinylPaths(del))
    .pipe(gulp.dest("ready/gtfs"))
});

gulp.task('del:gtfs', ()=>(del([
  'ready/gtfs'])));

gulp.task('seed:gtfs', ['del:gtfs'], function () {
  return Seed(ALL_CONFIGS,/\.zip/).pipe(gulp.dest("ready/gtfs"))
});

gulp.task('del:osm', ()=>(del([
  'ready/osm'])));

gulp.task('seed:osm', ['del:osm'], function () {
  return Seed(ALL_CONFIGS,/\.osm\.pbf/).pipe(gulp.dest("ready/osm"))
});

 /**
  * Seed GTFS & OSM data with data from previous data-containes to allow
  * continuous flow of data into production.
  */
gulp.task('seed', ['seed:osm','seed:gtfs'])

gulp.task('filter-data', function() {
  return OBAFilter("processed/gtfs/hsl.zip" );
});

gulp.task('map-fit', function() {
  return fitGTFS("processed/osm/finland.osm.pbf","processed/gtfs/hsl.zip", "processed/gtfs/hsl-fitted.zip");
});

gulp.task('hsl', function(){
  return gulp.src(["processed/gtfs/*"],{read:false}).pipe(map(setId));
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
})
