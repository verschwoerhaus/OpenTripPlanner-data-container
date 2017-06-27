const through = require('through2');
const gutil = require('gulp-util');
const col = gutil.colors;
const fs = require('fs');
const path = require('path');
const cloneable = require('cloneable-readable');
const {dataToolImage} = require('../config.js');
/*
 * node.js wrapper for MapFit

 */
const exec = require('child_process').exec;

const run = function(cmd, osmExtract, src, dst) {
  const p = new Promise((resolve) => {

    const fit = exec(`docker run -e TCMALLOC_LARGE_ALLOC_REPORT_THRESHOLD=2147483648 -v $(pwd):/data --rm ${dataToolImage} ${cmd} /data/${osmExtract} +init=epsg:3067 /data/${src} /data/${dst}`,{maxBuffer:1024*1024*8});

    fit.stdout.on('data', function (data) {
      process.stdout.write(data.toString());
    });

    fit.stderr.on('data', function (data) {
      process.stdout.write(col.red(data.toString()));
    });

    fit.on('exit', resolve);
  });
  return p;
};

module.exports= {
  /**
   * returns promise
   */
  fitGTFS: function(osmExtract, src, dst) {
    return run('gtfs_shape_mapfit/fit_gtfs.bash', osmExtract, src, dst);
  },

  fitGTFSTask: (configs) => {
    return through.obj(function(file, encoding, callback) {

      const gtfsFile = file.history[file.history.length-1];
      const fileName = gtfsFile.split('/').pop();
      const relativeFilename = path.relative(process.cwd(), gtfsFile);
      const id = fileName.substring(0,fileName.indexOf('.'));
      const config = configs[id];
      if(config===undefined) {
        process.stdout.write(col.yellow(`${gtfsFile} Could not find config for Id:${id}, ignoring fit...\n`));
        callback(null, null);
        return;
      }
      if(config.fit===false) {
        process.stdout.write(gtfsFile + col.green(' fit skipped\n'));
        callback(null, file);
      } else {
        let script = '';
        if(config.fit===true) {
          script = 'gtfs_shape_mapfit/fit_gtfs.bash';
        } else {
          script = config.fit;
        }
        const src = `${relativeFilename}`;
        const dst = `${relativeFilename}-fitted`;

        run(script, 'ready/osm/finland.pbf', src, dst).then((status) => {
          if(status===0) {
            fs.unlinkSync(src);
            fs.renameSync(dst, src);
            process.stdout.write(gtfsFile + col.green(' fit SUCCESS\n'));
            file.contents=cloneable(fs.createReadStream(gtfsFile));
            callback(null, file);
          } else {
            process.stdout.write(gtfsFile + col.red(' fit FAILED\n'));
            callback(null, null);
          }
        });
      }
    });
  }
};
