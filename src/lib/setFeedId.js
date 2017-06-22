const JSZip = require('JSZip');
const fs = require('fs');
const converter = require('json-2-csv');
const through = require('through2');
const gutil = require('gulp-util');
const col = gutil.colors;
const cloneable = require('cloneable-readable');

function createFeedInfo(zip, file, csv, cb) {
  zip.file('feed_info.txt', csv);
  zip.generateNodeStream({streamFiles:true,compression: 'DEFLATE'})
  .pipe(fs.createWriteStream(file))
  .on('finish', function () {
    cb(null);
  });
}

function setFeedId(file, id, cb) {
  fs.readFile(file, function (err, data) {
    if (err) cb(err);
    const zip = new JSZip();
    zip.loadAsync(data).then(function () {
      const feedInfo = zip.file('feed-info.txt');
      if(feedInfo===null) {
        const csv =`feed_publisher_name,feed_publisher_url,feed_lang,feed_id
${id}-fake-name,${id}-fake-url,${id}-fake-lang,${id}\n`;

        createFeedInfo(zip, file, csv, () => {
          cb('created');
        });
        return;
      } else {
        feedInfo.async('string').then(function(data){
          const csv2jsonCallback = function (err, json) {

            const json2csvcallback = function(err, csv) {
              createFeedInfo(zip, file, csv, () => {
                cb('edited');
              });
            };
            if (err) cb(err);
            if(json.length>0) {
              if(json[0]['feed_id']===undefined || json[0]['feed_id']!==id) {
                json[0]['feed_id']=id;
                converter.json2csv(json, json2csvcallback);
              } else {
                cb('nop');
              }
            }
          };
          converter.csv2json(data, csv2jsonCallback);
        });
      }
    });
  });
}

/**
 * Sets gtfs feed id
 */
module.exports= {
  setFeedIdTask: () => {
    return through.obj(function(file, encoding, callback) {
      const gtfsFile = file.history[file.history.length-1];
      const fileName = gtfsFile.split('/').pop();
      const id = fileName.substring(0,fileName.indexOf('.'));
      process.stdout.write(gtfsFile + ' ' + 'Setting GTFS ID to ' + id + '\n');
      setFeedId(gtfsFile, id, (action) => {
        process.stdout.write(gtfsFile + ' ' + col.green('ID ' + action + ' SUCCESS\n'));
        file.contents=cloneable(fs.createReadStream(gtfsFile));
        callback(null, file);
      });
    });
  }
};
