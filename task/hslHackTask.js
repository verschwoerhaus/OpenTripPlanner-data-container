const exec = require('child_process').exec;
const gutil = require('gulp-util');
const col = gutil.colors;
const {dataToolImage, hostDataDir} = require('../config.js');

/**
 * remove column from stop_times.txt
 */
module.exports = function(){


  const p = new Promise((resolve, reject) => {

    const lastLog=[];
    const cmd = `set +e
    cd /data/fit
  unzip -o gtfs/HSL.zip stop_times.txt
  # TODO: Check that the line is in expected format
  # Needed in order to get rid of 'shape_distance_travelled'
  # this field is not currently available in shapes.txt. OpenTripPlanner needs it to be.
  cut --complement -f 9 -d, stop_times.txt > stop_times.new
  mv stop_times.new stop_times.txt
  zip -f gtfs/HSL.zip stop_times.txt
  rm stop_times.txt`;
    const fullCommand = `docker run --rm -v ${hostDataDir}:/data ${dataToolImage} bash -c "${cmd}"`;
    const hslHack = exec(fullCommand, {maxBuffer:1024*1024*8});

    hslHack.on('exit', function(c){
      if(c===0) {
        process.stdout.write(col.green('HSL Hack SUCCESS\n'));
        resolve();
      } else {
        const e = lastLog.join('');
        reject(e);
        process.stdout.write(col.red(`HSL Hack FAILED (${c})\n${e}\n`));
      }
    });

    hslHack.stdout.on('data', function (data) {
      lastLog.push(data.toString());
      if(lastLog.length===20) {
        delete lastLog[0];
      }
    });
  });
  return p;
};
