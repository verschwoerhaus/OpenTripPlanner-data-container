const through = require('through2');
const gutil = require('gulp-util');
const col = gutil.colors;
const execSync = require('child_process').execSync;
const fs = require('fs');
const JSZip = require('jszip');
const seedTag = process.env.OLD_TAG || 'latest';

/**
 * Download seed data from previous data containers.
 */
module.exports = function(configs, regexp){

  var stream = through.obj();

  let toProcess=configs.length;
  configs.forEach(c => {
    const container = `hsldevcom/opentripplanner-data-container-${c.id}:${seedTag}`;
    process.stdout.write(`extracting data from ${container}...\n`);
    const script =
  `docker rmi ${container} || true;
  docker rm data-extract-${c.id} || true;
  docker rename data-extract-${c.id} $(date +%s) || true; 
  docker create --name data-extract-${c.id} ${container};
  docker cp data-extract-${c.id}:var/www/localhost/htdocs/router-${c.id}.zip .;
  docker rm data-extract-${c.id}`;
    execSync(script);
    const file = `router-${c.id}.zip`;
    fs.readFile(file, function(err, data) {
      if (err) throw err;
      JSZip.loadAsync(data).then(function (zip) {
        const zips = zip.file(regexp);
        toProcess+=zips.length;
        toProcess-=1;
        zips.forEach(f => {
          const fileName = f.name.split('/').pop();
          f.async('arraybuffer').then(data => {
            const file = new gutil.File( {path:fileName, contents: new Buffer(data)} );
            stream.push(file);
            toProcess-=1;
            process.stdout.write(fileName + ' ' + col.green('Seed SUCCESS\n'));
            if(toProcess===0) {
              stream.end();
            }
          });
        });
      });
    });
  });

  return stream;
};
