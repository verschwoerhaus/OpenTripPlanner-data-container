const gulp = require('gulp');
const {setCurrentConfig} = require('./config');
require('./gulpfile');
const {promisify} = require('util');
const  everySeries = require('async/everySeries');
const {execFileSync}= require('child_process');
const {postSlackMessage} = require('./util');
const CronJob = require('cron').CronJob;

const every = promisify((list, task, cb) => {
  everySeries(list, task, function(err, result) {
    cb(err, result);
  });
});

const start = promisify((task, cb) => gulp.start(task,cb));

const updateOSM=['osm:update'];
const updateGTFS=['gtfs:dl','gtfs:fit','gtfs:filter','gtfs:id'];

const routers=['finland','waltti','hsl'];

start('seed').then(() => {
  const cronPattern = process.env.CRON || '0 0 4 * * *';
  process.stdout.write(`Starting timer with pattern: ${cronPattern}`);
  new CronJob(cronPattern, update, null, true, 'Europe/Helsinki');
});

async function update() {
  postSlackMessage('Starting data build');

  await every(updateOSM, function(task, callback) {
    start(task).then(() => {callback(null, true);});
  });

  //postSlackMessage('OSM data updated');

  await every(updateGTFS, function(task, callback) {
    start(task).then(() => {callback(null, true);});
  });

  //postSlackMessage('GTFS data updated');

  await every(routers, function(router, callback) {
    //postSlackMessage(`Starting build & deploy for ${router}...`);
    setCurrentConfig(router);
    start('router:buildGraph').then(() => {
      try {
        process.stdout.write('Executing deploy script.');
        execFileSync('./deploy.sh',[router], {env:{DOCKER_USER:process.env.DOCKER_USER,DOCKER_AUTH:process.env.DOCKER_AUTH}, stdio:[0,1,2]});
        postSlackMessage(`${router} data updated.`);
      } catch (E) {
        postSlackMessage(`${router} data update failed: ` + E.message);
      }
      callback(null, true);
    });
  });

  //postSlackMessage('Data build completed');

}
