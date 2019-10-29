const gulp = require('gulp')
const { setCurrentConfig } = require('./config')
require('./gulpfile')
const { promisify } = require('util')
const everySeries = require('async/everySeries')
const { execFileSync } = require('child_process')
const { postSlackMessage } = require('./util')
const CronJob = require('cron').CronJob

const every = promisify((list, task, cb) => {
  everySeries(list, task, function (err, result) {
    cb(err, result)
  })
})

const start = promisify((task, cb) => gulp.series(task)(cb))

const updateDEM = ['dem:update']
const updateOSM = ['osm:update']
const updateGTFS = ['gtfs:dl', 'gtfs:fit', 'gtfs:filter', 'gtfs:id']

let routers
if (process.env.ROUTERS) {
  routers = process.env.ROUTERS.replace(/ /g, '').split(',')
} else {
  routers = ['finland', 'waltti', 'hsl']
}

/*
start('seed').then(() => {
  process.stdout.write('Seeded.\n')
  if (process.argv.length === 3 && process.argv[2] === 'once') {
    process.stdout.write('Running update once.\n')
    update()
  } else {
    const cronPattern = process.env.CRON || '0 0 3 * * *'
    process.stdout.write(`Starting timer with pattern: ${cronPattern}\n`)
    new CronJob(cronPattern, update, null, true, 'Europe/Helsinki') // eslint-disable-line
  }
}).catch((err) => {
  process.stdout.write(err + '\n')
  process.exit(1)
})
*/
update()

async function update () {
  postSlackMessage('Starting data build')
  setCurrentConfig(routers.join(',')) // restore used config

  await every(updateDEM, function (task, callback) {
    start(task).then(() => { callback(null, true) })
  })

  await every(updateOSM, function (task, callback) {
    start(task).then(() => { callback(null, true) })
  })

  // postSlackMessage('OSM data updated');

  await every(updateGTFS, function (task, callback) {
    start(task).then(() => { callback(null, true) })
  })

  // postSlackMessage('GTFS data updated');

  await every(routers, function (router, callback) {
    // postSlackMessage(`Starting build & deploy for ${router}...`);
    setCurrentConfig(router)
    start('router:buildGraph').then(() => {
      try {
        process.stdout.write('Executing deploy script.\n')
        execFileSync('./deploy.sh', [router],
          {
            env: Object.assign({}, process.env,
              {
                TEST_TAG: process.env.OTP_TAG || '',
                TOOLS_TAG: process.env.TOOLS_TAG || '',
              }),
            stdio: [0, 1, 2]
          }
        )
        postSlackMessage(`${router} data updated.`)
      } catch (E) {
        postSlackMessage(`${router} data update failed: ` + E.message)
      }
      callback(null, true)
    })
  })

  // postSlackMessage('Data build completed');
}
