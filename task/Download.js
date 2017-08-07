const through = require('through2');
const gutil = require('gulp-util');
const request = require('request');
const col = gutil.colors;
const {postSlackMessage} = require('../util');

/**
 * Download external data (gtfs, osm) resources.
 */
module.exports = function(entries){

  let downloadCount=0;

  var stream = through.obj();

  const incProcessed= () => {
    downloadCount+=1;
    if(downloadCount != entries.length){
      downloadIgnoreErrors(entries[downloadCount]);
    }else{
      stream.end();
    }
  };

  const downloadIgnoreErrors = (entry) => {
    const downloadHandler = (err, res, body) => {
      if(err) {
        postSlackMessage(`${entry.url} Download failed: ${err}`);
        process.stdout.write(entry.url + ' ' + col.red('Download FAILED\n'));
        incProcessed();
        return;
      }
      const name = entry.url.split('/').pop();
      const fileExt = name.split('.').pop();
      const file = new gutil.File( {path:`${entry.id!==undefined?(entry.id + '.' + fileExt):name}`, contents: new Buffer(body)} );
      stream.push(file);

      process.stdout.write(entry.url + ' ' + col.green('Download SUCCESS\n'));
      incProcessed();
    };

    process.stdout.write('Downloading ' + entry.url+ '...\n');
    request({url:entry.url,encoding:null}, downloadHandler);


  };
  downloadIgnoreErrors(entries[0]);

  return stream;
};
