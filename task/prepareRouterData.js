const through = require('through2')
const gutil = require('gulp-util')
const fs = require('fs')
const cloneable = require('cloneable-readable')
const { routerDir } = require('../util')
const osmFile = (config) => config.osm + '.pbf'
const gtfsFile = (src) => src.id + '.zip'
const { dataDir } = require('../config')

function createFile (config, fileName, source) {
  const name = `${config.id}/router/${fileName}`
  process.stdout.write(`copying ${fileName}...\n`)
  const file = new gutil.File({ path: name, contents: cloneable(fs.createReadStream(source)) })
  return file
}

/**
 * Make router data ready for inclusion in data container.
 */
module.exports = function (configs) {
  const stream = through.obj()

  configs.forEach(config => {
    stream.push(createFile(config, 'build-config.json', `${routerDir(config)}/build-config.json`))
    stream.push(createFile(config, 'router-config.json', `${routerDir(config)}/router-config.json`))
    stream.push(createFile(config, osmFile(config), `${dataDir}/ready/osm/${osmFile(config)}`))
    config.src.forEach(src => {
      stream.push(createFile(config, gtfsFile(src), `${dataDir}/ready/gtfs/${gtfsFile(src)}`))
    })
  })
  stream.end()

  return stream
}
