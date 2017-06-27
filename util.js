const JSZip = require('JSZip');
const fs = require('fs');
const globby = require('globby');

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


module.exports= {
  zipDir: (zipFile, dir, cb) => {
    zipWithGlob(zipFile, [`${dir}/*`], undefined, cb);
  },

  /**
   * zipFile file to create
   * dir directory for source files
   * glob pattern array
   * cb function to call when done
   */
  zipWithGlob,
  routerDir: (config) => `router-${config.id}`
};
