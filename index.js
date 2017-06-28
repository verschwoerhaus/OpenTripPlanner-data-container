const gulp = require('gulp');
const {setCurrentConfig} = require('./config');
require('./gulpfile');
const {promisify} = require('util');
const  everySeries = require('async/everySeries');

const every = promisify((list, task, cb) => {
  everySeries(list, task, function(err, result) {
    cb(err, result);
  });
});

const start = promisify((task, cb) => gulp.start(task,cb));

const updateOSM=['osm:update'];
const updateGTFS=['gtfs:dl','gtfs:id','gtfs:fit','gtfs:filter'];

const routers=['hsl,waltti,finland'];

var CronJob = require('cron').CronJob;
new CronJob('0 28 * * * *',
  update, null, true, 'Europe/Helsinki');

function update() {
  every(updateOSM, function(task, callback) {
    start(task).then(() => { callback(null, true);});
  }).then(() => {
    process.stdout.write('OSM data updated\n');
  }).then(() => every(updateGTFS, function(task, callback) {
    start(task).then(() => { callback(null, true);});
  }).then(() => {
    process.stdout.write('GTFS data updated\n');
  })).then(
  () => {
    every(routers, function(router, callback) {
      process.stdout.write('starting build & deploy for', router);
      setCurrentConfig(router);
      start('router:buildGraph').then(() => { callback(null, true);});
    }).then(() => {
      //run deploy for router
      process.stdout.write('router data updated.');
    });
  }
);
}
