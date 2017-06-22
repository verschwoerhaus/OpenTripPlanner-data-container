const through = require('through');
const gutil = require('gulp-util');
const fs = require('fs');
const cloneable = require('cloneable-readable');
const routerDir=(config) => 'router-' + config.id;
const osmFile=(config) => config.osm + '.pbf';
const gtfsFile=(src) => src.id + '.zip';


function createFile(config, fileName, source) {
  const name = config.id + '/' + fileName;
  const file = new gutil.File( {path:name, contents: cloneable(fs.createReadStream(source))});
  return file;
}

/**
 * Make router data ready for inclusion in data container.
 */
module.exports = function(configs){

  const stream = new through(
    function(file,enc,cb){
      this.push(file);
      cb();
    }
  );

  setTimeout(() => {
    configs.forEach(config => {
      stream.queue(createFile(config, 'build-config-json', routerDir(config) + '/build-config.json'));
      stream.queue(createFile(config, 'router-config-json', routerDir(config) + '/router-config.json'));
      stream.queue(createFile(config, osmFile(config), 'ready/osm/' + osmFile(config)));
      config.src.forEach(src => {
        stream.queue(createFile(config, gtfsFile(src), 'ready/gtfs/' + gtfsFile(src)));
      });
    });

    stream.emit('end');
  }, 0);


  return stream;
};
