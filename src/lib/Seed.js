const through = require("through");
const gutil = require("gulp-util");
const request = require("request");
const col = gutil.colors;
const execSync = require('child_process').execSync;
const fs = require("fs");
const JSZip = require("jszip");

/**
 * Download seed data from previous data containers.
 */
module.exports = function(configs, regexp){

  const stream = through(
    function(file,enc,cb){
		this.push(file);
		cb();
	});

  let toProcess=configs.length;
  configs.forEach(c => {
    const s =
  `docker rm data-extract-${c.id};
  docker create --name "data-extract-${c.id}" hsldevcom/opentripplanner-data-container-${c.id}:prod;
  docker cp data-extract-${c.id}:var/www/localhost/htdocs/router-${c.id}.zip .;
  docker rm data-extract-${c.id}`;
    const code = execSync(s);
    const file = `router-${c.id}.zip`
    fs.readFile(file, function(err, data) {
      if (err) throw err;
      JSZip.loadAsync(data).then(function (zip) {
        const zips = zip.file(regexp);
        toProcess+=zips.length;
        toProcess-=1;
        zips.forEach(f=>{
          const fileName = f.name.split('/').pop();
          f.async("arraybuffer").then(data=>{
            const file = new gutil.File( {path:fileName, contents: new Buffer(data)} );
            stream.queue(file);
            toProcess--;
            process.stdout.write(fileName + ' ' + col.green('Seed SUCCESS\n'));
            if(toProcess===0) {
              stream.emit('end')
            }
          })
        })
      })
    });
  });

	return stream;
}
