var through = require("through");
var gutil = require("gulp-util");
var request = require("request");
var col = gutil.colors;

/**
 * Download external data (gtfs, osm) resources.
 */
module.exports = function(entries){
  let downloadCount=0;

  var stream = through(
    function(file,enc,cb){
		this.push(file);
		cb();
	});

	const downloadIgnoreErrors = (entry) => {

    const downloadHandler = (err, res, body) =>{
      if(err) {
        process.stdout.write(entry.url + ' ' + col.red('Download FAILED\n'));
        incProcessed();
        return;
      }
      const name = entry.url.split('/').pop();
      const fileExt = name.split('.').pop();
      const file = new gutil.File( {path:`${entry.id!==undefined?(entry.id + '.' + fileExt):name}`, contents: new Buffer(body)} );
      stream.queue(file);

      process.stdout.write(entry.url + ' ' + col.green('Download SUCCESS\n'));
      incProcessed();
    }

    process.stdout.write('Downloading ' + entry.url+ "...\n");
		request({url:entry.url,encoding:null}, downloadHandler);

    const incProcessed= () => {
      downloadCount+=1;
      if(downloadCount != entries.length){
        downloadIgnoreErrors(entries[downloadCount])
      }else{
        stream.emit('end')
      }
    }
	}
	downloadIgnoreErrors(entries[0])

	return stream;
}
