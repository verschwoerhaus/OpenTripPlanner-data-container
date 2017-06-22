const JSZip = require('JSZip');
const fs = require('fs');
const path = require('path');

module.exports= {
  zipDir: (zipFile, dir, cb) => {
    const zip = new JSZip();
    fs.readdirSync(dir).forEach(file => zip.file(file, fs.createReadStream(path.resolve(dir, file))));
    zip.generateNodeStream({streamFiles:true,compression: 'DEFLATE'})
      .pipe(fs.createWriteStream(zipFile))
      .on('finish', () => {
        cb();
      });
  }
};
