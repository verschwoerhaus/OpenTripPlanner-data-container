const JSZip = require('jszip');
const fs = require('fs');
const globby = require('globby');

const IncomingWebhook = require('@slack/client').IncomingWebhook;
const url = process.env.SLACK_WEBHOOK_URL || null;
const webhook = url !==null ? new IncomingWebhook(url, {username:'OTP data builder', channel:'ci'}):null;

/**
 * zipFile file to create
 * dir directory for source files
 * glob pattern array
 * cb function to call when done
 */
const zipWithGlob = (zipFile, glob, zipDir, cb) => {

  return globby(glob).then(paths => {
    let zip = new JSZip();

    if(zipDir!==undefined ) {
      zip.folder(zipDir);
    }
    paths.forEach(file => {
      zip.file((zipDir!==undefined?(zipDir + '/'):'') + file.split('/').pop(), fs.createReadStream(file));
    });
    zip.generateNodeStream({streamFiles:true, compression: 'DEFLATE',compressionOptions : {level:6}})
      .pipe(fs.createWriteStream(zipFile))
      .on('finish', (err) => {
        cb(err);
      });
  });
};

const postSlackMessage = (message) => {
  if(webhook===null) {
    process.stdout.write(`Not sending to slack: ${message}`);
    return;
  }

  process.stdout.write(`Sending to slack: ${message}`);

  webhook.send(message, function(err) {
    if (err) {
      process.stdout.write(`ERROR sending to slack: ${err}`);
    }
  });
};


module.exports= {
  zipDir: (zipFile, dir, cb) => {
    zipWithGlob(zipFile, [`${dir}/*`], undefined, cb);
  },
  zipWithGlob,
  routerDir: (config) => `router-${config.id}`,
  postSlackMessage
};
