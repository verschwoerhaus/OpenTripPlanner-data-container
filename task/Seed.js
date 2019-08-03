const through = require('through2')
const Vinyl = require('vinyl')
const execSync = require('child_process').execSync
const fs = require('fs')
const JSZip = require('jszip')
const seedTag = process.env.SEED_TAG || 'latest'
const org = process.env.ORG || 'hsldevcom'

/**
 * Download seed data from previous data containers.
 */
module.exports = function (configs, regexp) {
  var stream = through.obj()

  let toProcess = configs.length
  configs.forEach(c => {
    const container = `${org}/opentripplanner-data-container-${c.id}:${seedTag}`
    process.stdout.write(`extracting data from ${container}...\n`)
    try {
      execSync(`docker image inspect ${container}`)
    } catch (err) {
      process.stdout.write(`Image ${container} is unknown\n`)
      return stream.end()
    }
    const script =
  `docker rmi --force ${container} || true;
  docker rm data-extract-${c.id} || true;
  docker rename data-extract-${c.id} $(date +%s) || true; 
  docker create --name data-extract-${c.id} ${container};
  docker cp data-extract-${c.id}:var/www/localhost/htdocs/router-${c.id}.zip .;
  docker rm data-extract-${c.id}`
    execSync(script)
    const file = `router-${c.id}.zip`
    fs.readFile(file, function (err, data) {
      if (err) {
        process.stdout.write(err)
        throw err
      }
      JSZip.loadAsync(data).then(function (zip) {
        const zips = zip.file(regexp)
        toProcess += zips.length
        toProcess -= 1
        zips.forEach(f => {
          const fileName = f.name.split('/').pop()
          f.async('arraybuffer').then(data => {
            const file = new Vinyl({ path: fileName, contents: Buffer.from(data) })
            stream.push(file)
            toProcess -= 1
            process.stdout.write(fileName + ' Seed SUCCESS\n')
            if (toProcess === 0) {
              stream.end()
            }
          })
        })
      })
    })
  })

  return stream
}
