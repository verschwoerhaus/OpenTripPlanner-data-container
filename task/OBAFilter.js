/*
 * Wrapper for OBA filtering
 */
const exec = require('child_process').exec;
const through = require('through2');
const gutil = require('gulp-util');
const col = gutil.colors;
const fs = require('fs');
const path = require('path');
const async = require('async');
const cloneable = require('cloneable-readable');
const del = require('del');
const {zipDir} = require('../util');
const {dataToolImage} = require('../config.js');

/**
 * returns promise that resolves to true (success) or false (failure)
 */
function OBAFilter(src, dst, rule) {
  const p = new Promise((resolve) => {
    let success = true;
    let lastLog = [];
    const process = exec(`docker run -v $(pwd):/data --rm ${dataToolImage} java -jar one-busaway-gtfs-transformer/onebusaway-gtfs-transformer-cli.jar --transform=${rule} /data/${src} /data/${dst}`);

    const checkError=(data) => {
      if(success)
        lastLog.push(data.toString());
      if(lastLog.length>20) {
        delete lastLog[0];
      }
      if(data.toString().indexOf('Exception') !==-1) {
        success = false;
      }
    };

    process.stdout.on('data', data => checkError(data));

    process.stderr.on('data', data => checkError(data));

    process.on('exit', function (code) {
      if(code === 0 && success===true) {
        resolve(true);
      } else {
        process.stdout.write(src + ' ' + col.red(lastLog.join('')));
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
      const id = fileName.substring(0,fileName.indexOf('.'));
      const config = configs[id];
      if(config===undefined) {
        process.stdout.write(col.yellow(`${gtfsFile} Could not find config for Id:${id}, ignoring filter...\n`));
        callback(null, null);
        return;
      }

      if(config.rules!==undefined) {
        const src = `${relativeFilename}`;
        const dst = `${relativeFilename}-filtered`;

        let hasFailures = false;
        const functions = config.rules.map((rule) => (done) => {
          OBAFilter(src,dst,rule).then((success) => {
            if(success) {
              fs.unlinkSync(src);

              /* create zip named src from files in dst*/
              zipDir(src, dst, () => {
                del([dst]);
                process.stdout.write(rule + ' ' + gtfsFile + col.green(' filter SUCCESS\n'));
                done();
              });
            } else {
              hasFailures=true;
              process.stdout.write(rule + ' ' + gtfsFile + col.red(' filter FAILED\n'));
              done();
            }
          });
        });
        async.waterfall(functions, () => {
          if(hasFailures) {
            callback(null, null);
          } else {
            file.contents=cloneable(fs.createReadStream(gtfsFile));
            callback(null, file);
          }
        });
      } else {
        process.stdout.write(gtfsFile + col.green(' filter skipped\n'));
        callback(null, file);
      }
    });
  }
};
