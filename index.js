const gulp = require('gulp');
const {setCurrentConfig} = require('./config');
require('./gulpfile');
const {promisify} = require('util');
const  everySeries = require('async/everySeries');
const {execFileSync}= require('child_process');

const every = promisify((list, task, cb) => {
  everySeries(list, task, function(err, result) {
    cb(err, result);
  });
});

setCurrentConfig('waltti');
const start = promisify((task, cb) => gulp.start(task,cb));

const updateOSM=['osm:update'];
const updateGTFS=['gtfs:dl','gtfs:id','gtfs:fit','gtfs:filter'];

const routers=['waltti'];

console.log('I am alive!');

///testing without cron
//start('seed').then(() => {
//  var CronJob = require('cron').CronJob;
//  new CronJob(process.env.CRON || '0 28 * * * *', update, null, true, 'Europe/Helsinki');
//});

//start('seed').then(() => {
update();
//});

async function update() {

  await every(updateOSM, function(task, callback) {
    start(task).then(() => {callback(null, true);});
  });

  process.stdout.write('OSM data updated\n');

  await every(updateGTFS, function(task, callback) {
    start(task).then(() => {callback(null, true);});
  });

  process.stdout.write('GTFS data updated\n');

  await every(routers, function(router, callback) {
    process.stdout.write(`Starting build & deploy for ${router}...`);
    setCurrentConfig(router);
    start('router:buildGraph').then(() => {
      try {
        process.stdout.write('Executing deploy script.');
        execFileSync('./deploy.sh',[router], {env:{DOCKER_USER:process.env.DOCKER_USER,DOCKER_AUTH:process.env.DOCKER_AUTH}, stdio:[0,1,2]});
        process.stdout.write('Router data updated.');
      } catch (E) {
        process.stdout.write('Router data update failed' + E.message);
      }
      callback(null, true);
    });
  });
}
