/*
 * wrapper for OBA filtering

 # One Bus away transform does not end terminate with a correct error code. Check that here and fail if configuration is set
 function transformGTFS() {
   if (! $1 2>&1) | grep "Exception"
   then
     echo "Failed to transform GTFS data"
     exit 1
   fi
 }


 transformGTFS "java -server -Xmx8G -jar $OBA_GTFS --transform=$ROUTER_FINLAND/gtfs-rules/matka.rule matka.zip koontikanta/matka.tmp"

OBA_GTFS=$ROOT/one-busaway-gtfs-transformer/onebusaway-gtfs-transformer-cli.jar

 */
const exec = require('child_process').exec;

module.exports= {
  /**
   * returns promise
   */
  OBAFilter: function(srz, dst, rule) {
    const p = new Promise((resolve, reject) => {

      let success = true;
      let lastError = null;
      ls = exec(`docker run -v $(pwd):/data --rm builder java -jar one-busaway-gtfs-transformer/onebusaway-gtfs-transformer-cli.jar --transform=${rule} /data/${src} /data/${dst}`);

      const checkError=(data)=> {
        lastLog = data.toString();
        if(data.toString().indexOf('Exception') !==-1) {
          success = false;
        }
      }

      ls.stdout.on('data', function (data) {
        checkError(data);
        console.log("stdout:" + data);
      });

      ls.stderr.on('data', function (data) {
        checkError(data);
        console.log("stderr:" + data);
      });

      ls.on('exit', function (code) {
        console.log('exit code: ', code);
        if(code === 0) {
          if(success) {
            resolve({e:null, success});
          } else {
            reject(code);
          }
        }
      });
    });
    return p;
  }

}
