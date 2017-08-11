const gutil = require('gulp-util');
const col = gutil.colors;
const {zipWithGlob} = require('../util');
const fs = require('fs');
const {dataDir, hostDataDir, constants} = require('../config.js');
const {postSlackMessage} = require('../util');
/*
 * node.js wrapper for building OTP graph
 */
const {exec, execSync}= require('child_process');

const buildGraph = function(config) {
  let lastLog=[];
  const collectLog = (data) => {
    lastLog.push(data.toString());
    if(lastLog.length > 20) {
      delete lastLog[0];
    }
  };
  const p = new Promise((resolve, reject) => {

    const version = execSync('docker pull hsldevcom/opentripplanner:prod;docker run --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -jar otp-shaded.jar --version"');
    const commit = version.toString().match(/commit: ([0-9a-f]+)/)[1];

    const buildGraph = exec(`docker run -v ${hostDataDir}/build:/opt/opentripplanner/graphs --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -Xmx7g -Dsentry.dsn=${process.env.SENTRY_DSN} -jar otp-shaded.jar --build graphs/${config.id}/router"`,{maxBuffer:constants.BUFFER_SIZE});
    //const buildGraph = exec('ls -la');

    buildGraph.stdout.on('data', function (data) {
      collectLog(data);
      process.stdout.write(data.toString());
    });

    buildGraph.stderr.on('data', function (data) {
      collectLog(data);
      process.stdout.write(col.red(data.toString()));
    });

    buildGraph.on('exit', (status) => {
      if(status===0) {
        resolve({commit:commit, config:config});
      } else {
        const log = lastLog.join('');
        postSlackMessage(`${config.id} build failed: ${log}`);
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
          zipWithGlob(`${dataDir}/build/${config.id}/router-${config.id}.zip`,
            [`${dataDir}/build/${config.id}/router/*.zip`, `${dataDir}/build/${config.id}/router/*.json`,`${dataDir}/build/${config.id}/router/${config.osm}.pbf`],
            `router-${config.id}`,
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
          zipWithGlob(`${dataDir}/build/${config.id}/graph-${config.id}-${commit}.zip`,
            [`${dataDir}/build/${config.id}/router/Graph.obj`, `build/${config.id}/router/router-*.json`],
            config.id,
            (err) => {
              if(err) {
                reject(err);
              } else {
                resolve();
              }
            });
        });

        const p3 = new Promise((resolve, reject) => {
          fs.writeFile(`${dataDir}/build/${config.id}/version.txt`, new Date().toISOString(), function(err) {
            if(err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        return Promise.all([p1,p2,p3]);
      });
    })).then(() => {
      process.stdout.write(col.green('Created SUCCESS\n'));
    });
  }};
