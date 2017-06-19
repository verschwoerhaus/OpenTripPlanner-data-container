/*
 * node.js wrapper for MapFit

 */
const exec = require('child_process').exec;

const run = function(cmd, osmExtract, src, dst) {
  const p = new Promise((resolve, reject) => {

    const fit = exec(`docker run -v $(pwd):/data --rm builder ${cmd} /data/${osmExtract} +init=epsg:3067 /data/${src} /data/${dst}`);

    fit.stdout.on('data', function (data) {
      process.stdout.write(data.toString());
    });

    fit.stderr.on('data', function (data) {
      process.stdout.write("<stderr>: " + data.toString());
    });

    fit.on('exit', function (code) {
      console.log('exit code: ', code);
      resolve(code);
    });
  });
  return p;
}

module.exports= {
  /**
   * returns promise
   */
  fitGTFS: function(osmExtract, src, dst) {
    return run('gtfs_shape_mapfit/fit_gtfs.bash', osmExtract, src, dst);
  }
}
