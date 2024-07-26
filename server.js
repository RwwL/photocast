var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    ejs = require('ejs'),
    depth = 0;

var indexFile = fs.readFileSync('./index.ejs', 'utf8');

function isImg(filename){
  return /\.jpg$/.test(filename) || /\.jpeg$/.test(filename) || /\.png$/.test(filename) || /\.gif$/.test(filename);
}

function readDirectory(dir, callback){
  //console.log('readDirectory: '+dir);
  var fullDir = path.join(process.cwd(), dir);
  fs.readdir(fullDir, function(err, files){
    if(err){
      console.log('readDirectory error, ', err);
    }
    if(files){
      var
        count = files.length,
        ret = {
          canGoUp: false,
          files: [],
          folders: []
        }, done = function(){
          if(--count === 0){
            if(callback) {
              callback(ret);
            }
          }
        };
      if(dir != '/') ret.canGoUp = true;
      files.forEach(function(file){
        //console.log('file trying lstat:');
        //console.log(file);
        fs.lstat(path.join(fullDir, file), function(err, stats) {
          if(err){
            console.log('lstat error:');
            console.log(err);
          }
          if(stats.isDirectory()) ret.folders.push(file);
          else if(isImg(file)) ret.files.push(dir + file);
          done();
        });
      });
    }
  });
}


http.createServer(function (req, res) {
    if (path.normalize(unescape(req.url)) !== unescape(req.url)) {
        res.writeHead(403, {"Content-Type": "text/plain"});
        res.end();
        return;
    }
  console.log('request: '+req.url+'');
  var isIndex = false,
      uri = url.parse(req.url).pathname,
      filename = path.join(process.cwd(), unescape(uri));
  //console.log('server request | filename: '+filename);

  fs.exists(filename, function(exists) {
    if(!exists) {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
      return;
    }

    // IS DIRECTORY
    if (fs.statSync(filename).isDirectory()) {
      //console.log('-- IS directory, serve up the listing');
      readDirectory(unescape(uri), function(dirListing){

        //console.log('dirListing');
        //console.log(dirListing);

        var resp = ejs.render(indexFile, dirListing);

        res.writeHead(200, { "Content-Type": "text/html"});
        res.write(resp);
        res.end();
        return;
      });

    }
    else {
      //console.log('--- not a directory, serve a file ---');
      fs.readFile(filename, "binary", function(err, file) {
        if(err) {
          res.writeHead(500, {"Content-Type": "text/plain"});
          res.write(err + "\n");
          res.end();
          return;
        }

        res.writeHead(200, {"Content-Type": "image/jpg"});
        res.write(file, "binary");
        res.end();
        return;
      });
    }



  });

}).listen(9999, '127.0.0.1');

console.log('Server running on :9999');

