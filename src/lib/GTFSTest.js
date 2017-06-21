const util = require('util');
const fs = require('fs');
const fse = require('fs-extra')
const exec = require('child_process').exec;
const through = require('through2');
var gutil = require("gulp-util");
var col = gutil.colors;

/**
 * Builds an OTP graph with gtfs file. If the build is succesful we can trust
 * the file is good enough to be used.
 */
function testGTFS(gtfsFile, quiet=false) {
  let lastLog=[];

  const p = new Promise((resolve, reject) => {
  if(fs.existsSync(gtfsFile)) {

  if(!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp');
  }
  fs.mkdtemp('tmp/gtfs-build-test', (err, folder) => {
    if (err) throw err;
    process.stdout.write("Testing " + gtfsFile + "...\n")
    const dir = folder.substring(4);
    const r = fs.createReadStream(gtfsFile)
    r.on('end', ()=>{
      try {
        const build = exec(`docker run -v $(pwd)/tmp:/opt/opentripplanner/graphs --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -Xmx6G -jar otp-shaded.jar --build graphs/${dir} "`,
      {maxBuffer:1024*1024*8});
        build.on('exit', function(c){
          if(c===0) {
            resolve(true);
            process.stdout.write(gtfsFile + ' ' + col.green('Test SUCCESS\n'));
          } else {
            process.stdout.write(gtfsFile + ' ' + col.red(`Test FAILED (${c})\n`));
            process.stdout.write(gtfsFile + ': ' + col.red(lastLog.join('')));
            resolve(false);
          }
          fse.removeSync(folder);
        })
        build.stdout.on('data', function (data) {
          lastLog.push(data.toString());
          if(lastLog.length===20) {
            delete lastLog[0];
          }
          if(!quiet) {
            process.stdout.write(data.toString());
          }
        });
        build.stderr.on('data', function (data) {
          lastLog.push(data.toString());
          if(lastLog.length===20) {
            delete lastLog[0];
          }
          if(!quiet) {
            process.stderr.write(data.toString());
          }
        });
      } catch(e) {
        console.log("no can do!", e);
        fse.removeSync(folder);
        reject(e);
      }
    });
    r.pipe(fs.createWriteStream(`${folder}/${gtfsFile.split('/').pop()}`));
});


} else {
  console.log("No such file:", gtfsFile);
}

});
return p;

}

module.exports= {
  testGTFSFile: (dir) => {
    return through.obj(function(file, encoding, callback) {
      const gtfsFile = file.history[file.history.length-1];
      testGTFS(gtfsFile, true).then((success)=>{
        if(success) {
          callback(null, file);
        } else {
          callback(null, null);
        }
      }).catch(()=>{
        callback(null, null);
      });
    })
  }
}


//module.exports.buildGTFS("hml.zip").then(()=>{console.log("done")});
