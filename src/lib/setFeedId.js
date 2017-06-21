const JSZip = require('JSZip');
const fs = require("fs")
const converter = require('json-2-csv');
const through = require('through2');
var gutil = require("gulp-util");
var col = gutil.colors;

function createFeedInfo(zip, file, id, cb) {
  const csv =
  `feed_publisher_name,feed_publisher_url,feed_lang,feed_id
${id}-fake-name,${id}-fake-url,${id}-fake-lang,${id}`
  zip.file("feed-info.txt", csv);
  zip.generateNodeStream({streamFiles:true,compression: "DEFLATE"})
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
    const feedInfo = zip.file("feed-info.txt")
    if(feedInfo===null) {
      createFeedInfo(zip, file, id, ()=>{
        cb("created");
      });
      return;
    } else {
      feedInfo.async("string").then(function(data){
        var csv2jsonCallback = function (err, json) {
          if (err) cb(err);
          if(json.length>0) {

          }
          console.log(typeof json);
          console.log(json.length);
          console.log(json);
        }
        converter.csv2json(data, csv2jsonCallback);
        cb("nop");
      });
    }
  })
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
      const id = fileName.substring(0,fileName.indexOf('.'))
      process.stdout.write(gtfsFile + ' ' + "Setting GTFS ID to " + id + '\n');
      setFeedId(gtfsFile, id, (action)=>{
        process.stdout.write(gtfsFile + ' ' + col.green('ID ' + action + ' SUCCESS\n'));
        callback(null, file);
      })
    })
    }
}
