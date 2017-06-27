const gutil = require('gulp-util');
const col = gutil.colors;
const {zipWithGlob} = require('../util');
/*
 * node.js wrapper for building OTP graph
 */
const {exec, execSync}= require('child_process');

const buildGraph = function(config) {
  const p = new Promise((resolve, reject) => {

    const version = execSync('docker run --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -jar otp-shaded.jar --version"');
    const commit = version.toString().match(/commit: ([0-9a-f]+)/)[1];

  //  const buildGraph = exec(`docker run -v $(pwd)/build:/opt/opentripplanner/graphs --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -Xmx7g -jar otp-shaded.jar --build graphs/${config.id}/router"`,{maxBuffer:1024*1024*8});
    const buildGraph = exec('ls -la');

    buildGraph.stdout.on('data', function (data) {
      process.stdout.write(data.toString());
    });

    buildGraph.stderr.on('data', function (data) {
      process.stdout.write(col.red(data.toString()));
    });

    buildGraph.on('exit', (status) => {
      if(status===0) {
        resolve({commit:commit, config:config});
      } else {
        reject('could not build');
      }
    });
  });
  return p;
};

module.exports= {

  buildOTPGraphTask: (configs) => {
    return Promise.all(configs.map(config => {
      return buildGraph(config).then(({commit, config}) => {
        const p1= new Promise((resolve, reject) => {
          process.stdout.write('Creating zip file for router data\n');
          //create zip file for the source data
          //include all gtfs + osm + router- + build configs
          zipWithGlob(`build/${config.id}/${config.id}-router.zip`, [`build/${config.id}/router/*.zip`, `build/${config.id}/router/*.json`,`build/${config.id}/router/finland.pbf`],
          (err) => {
            if(err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        const p2= new Promise((resolve, reject) => {
          process.stdout.write('Creating zip file for otp graph\n');
          //create zip file for the graph:
          //include  graph.obj + router-config.json
          zipWithGlob(`build/${config.id}/graph-${config.id}-${commit}.zip`, [`build/${config.id}/router/Graph.obj`, `build/${config.id}/router/router-*.json`],
        (err) => {
          if(err) {
            reject(err);
          } else {
            resolve();
          }
        });
        });
        return Promise.all([p1,p2]);
      });
    })).then(() => {
      process.stdout.write(col.green('Created SUCCESS\n'));
    });
  }};
