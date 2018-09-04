const col = require('ansi-colors');
const crypto = require('crypto');
const fs = require('fs');
const request = require('request');

const {dataDir} = require('../config');

/**
 * Download DEM files from Azure blob storage.
 */
module.exports = function(entries){
  return entries.map((entry) => {
    return new Promise((resolve, reject) => {
      const filePath = `${dataDir}/downloads/dem/${entry.id}.tif`;
      const r = request(entry.url);
      r.on('response', response => {
        let downloadHash = response.headers['content-md5'];
        // Validate MD5 Value
        var shasum = crypto.createHash('md5');
        var file = `${dataDir}/ready/dem/${entry.id}.tif`;
        var s = fs.ReadStream(file);
        // Download file as it's not found locally
        s.on('error', function(err) {
          process.stdout.write(col.red(`Failed to load local DEM data for ${entry.id}\n`));
          process.stdout.write(col.green(`Downloading new DEM data from ${entry.url}\n`));
        });
        s.on('data', function(data) {
          shasum.update(data);
        });
        s.on('end', function() {
          var fileHash = shasum.digest('base64');
          // Abort download as remote has same md5 as local copy
          if (fileHash == downloadHash) {
            r.abort();
            process.stdout.write(col.green(`Local DEM data for ${entry.id} was already up-to-date\n`));
            resolve(null);
          } else {
            process.stdout.write(col.green(`Downloading new DEM data from ${entry.url}\n`));
          }
        });
      });
      r.on('error', err => {
        process.stdout.write(col.red(err))
        process.stdout.write(col.green(`\nFailed to load new DEM data for ${entry.id}\n`));
        resolve(null);
      });
      r.on('end', () => {
        // If new file was downloaded, this resolves with the file's path
        // This is also called when request is aborted but new call to resolve shouldn't do anything
        // However, if the file is really small, this could in theory be called before call to abort request
        // but that situation shouldn't happen with DEM data sizes.
        resolve(filePath);
      });
      r.pipe(fs.createWriteStream(filePath))
    });
  });
}
