/*
 * Wrapper for OBA filtering
 */
const exec = require('child_process').exec;
const through = require('through2');
const gutil = require("gulp-util");
const col = gutil.colors;
const fs = require('fs');
const path = require('path');
const async = require('async');

/**
 * returns promise that resolves to true (success) or false (failure)
 */
function OBAFilter(src, dst, rule) {
  const p = new Promise((resolve, reject) => {

    let success = true;
    let lastLog = [];
    ls = exec(`docker run -v $(pwd):/data --rm builder java -jar one-busaway-gtfs-transformer/onebusaway-gtfs-transformer-cli.jar --transform=${rule} /data/${src} /data/${dst}`);

    const checkError=(data)=> {
      lastLog.push(data.toString());
      if(lastLog.length>20) {
        delete lastLog[0];
      }
      if(data.toString().indexOf('Exception') !==-1) {
        success = false;
      }
    }

    ls.stdout.on('data', function (data) {
      checkError(data);
    });

    ls.stderr.on('data', function (data) {
      checkError(data);
    });

    ls.on('exit', function (code) {
      console.log('exit code: ', code, success);
      if(code === 0 && success===true) {
        resolve(true);
      } else {
        process.stdout.write(src + ' ' + col.red(lastLog.join("")));
          resolve(false);
      }
    });
  });
  return p;
}

module.exports= {
  OBAFilterTask: (configs) => {
    return through.obj(function(file, encoding, callback) {

      const gtfsFile = file.history[file.history.length-1];
      const fileName = gtfsFile.split('/').pop();
      const relativeFilename = path.relative(process.cwd(), gtfsFile);
      const id = fileName.substring(0,fileName.indexOf('.'))
      const config = configs[id];
      if(config===undefined) {
        throw new Error(`Could not find config for Id:${id}`);
      }

      if(config.rules!==undefined) {
        const src = `${relativeFilename}`;
        const dst = `${relativeFilename}-filtered`;

        const hasFailures = false;

        const functions = config.rules.map((rule)=>(done)=>{
          OBAFilter(src,dst,rule).then((success)=>{
            if(success) {
              fs.unlinkSync(src);
              fs.renameSync(dst, src);
              process.stdout.write(rule + " " + gtfsFile + col.green(" filter SUCCESS\n"));
            } else {
              hasFailures=true;
              process.stdout.write(rule + " " + gtfsFile + col.red(" filter FAILED\n"));
            }
            done();
          })
        });
        async.waterfall(functions, function (err, result) {
          if(hasFailures) {
            callback(null, null);
          } else {
            callback(null, file);
          }
        });
      } else {
        process.stdout.write(gtfsFile + col.green(" filter skipped\n"));
        callback(null, file);
      }
    })
  }
}
