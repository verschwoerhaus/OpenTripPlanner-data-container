const JSZip = require('JSZip');
const fs = require('fs');
const globby = require('globby');


const zipWithGlob = (zipFile, glob, cb) => {

  return globby(glob).then(paths => {
    const zip = new JSZip();
    paths.forEach(file => {
      zip.file(file.split('/').pop(), fs.createReadStream(file));
    });

    zip.generateNodeStream({streamFiles:true,compression: 'DEFLATE',compressionOptions : {level:6}})
      .pipe(fs.createWriteStream(zipFile))
      .on('finish', (err) => {
        cb(err);
      });
  });
};


module.exports= {
  zipDir: (zipFile, dir, cb) => {
    zipWithGlob(zipFile, [`${dir}/*`], cb);
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
