const gulp = require('gulp');
const {setCurrentConfig} = require('./config');
require('./gulpfile');
const {promisify} = require('util');
const  everySeries = require('async/everySeries');
const {execFileSync}= require('child_process');
const {postSlackMessage} = require('./util');

const every = promisify((list, task, cb) => {
  everySeries(list, task, function(err, result) {
    cb(err, result);
  });
});

const start = promisify((task, cb) => gulp.start(task,cb));

const updateOSM=['osm:update'];
const updateGTFS=['gtfs:dl','gtfs:id','gtfs:fit','gtfs:filter'];

const routers=['finland','waltti','hsl'];

start('seed').then(() => {
  var CronJob = require('cron').CronJob;
  new CronJob(process.env.CRON || '0 0 4 * * *', update, null, true, 'Europe/Helsinki');
});

async function update() {
  postSlackMessage('Starting data build');

  await every(updateOSM, function(task, callback) {
    start(task).then(() => {callback(null, true);});
  });

  postSlackMessage('OSM data updated');

  await every(updateGTFS, function(task, callback) {
    start(task).then(() => {callback(null, true);});
  });

  postSlackMessage('GTFS data updated');

  await every(routers, function(router, callback) {
    postSlackMessage(`Starting build & deploy for ${router}...`);
    setCurrentConfig(router);
    start('router:buildGraph').then(() => {
      try {
        process.stdout.write('Executing deploy script.');
        execFileSync('./deploy.sh',[router], {env:{DOCKER_USER:process.env.DOCKER_USER,DOCKER_AUTH:process.env.DOCKER_AUTH}, stdio:[0,1,2]});
        process.stdout.write('Router data updated.');
      } catch (E) {
        postSlackMessage('Router data update failed: ' + E.message);
      }
      callback(null, true);
    });
  });

  postSlackMessage('Data build completed');

}
