const JSZip = require('JSZip');
const fs = require("fs")
const converter = require('json-2-csv');

function createFeedInfo(zip) {
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

module.exports= {
  setFeedId: function(file, id, cb) {
    fs.readFile(file, function (err, data) {
      if (err) cb(err);
      const zip = new JSZip();
      zip.loadAsync(data).then(function () {
      const feedInfo = zip.file("feed-info.txt")
      if(feedInfo===null) {
        createFeedInfo(zip);
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
          cb(null);
        });
      }
    })
    });
  }
}
