const gulp = require('gulp');
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
const router=['router:buildGraph'];

process.env.ROUTER='waltti';

every(updateGTFS, function(task, callback) {
  console.log('starting', task);
  gulp.start(task, callback);
}).then('GTFS updated!');


/*
var CronJob = require('cron').CronJob;
new CronJob('0 * * * * *',
  function() {
    console.log('starting...');
    foo('seed').then(() => {console.log('done');});

  },
  null, true, 'America/Los_Angeles');
*/
