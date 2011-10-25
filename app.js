
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'jakename' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: 'Express'
    }
  });
  
});

app.get('/ajax', function(req,res){
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('{"type":"FeatureCollection", "features":[{"type":"Feature","geometry":{"type":"Point","coordinates":["-81.9569", "40.7746"]}, "properties":{"bcid":"65"}}]}');
});

//The now configuration

var nowjs = require('now');
var everyone = nowjs.initialize(app);


nowjs.on('connect', function(){
  console.log("Joined: " + this.now.name);
});



everyone.now.distributeMessage = function(message){
  console.log("here is the message: " + message);
  everyone.now.recieveMessage("nothing", "morre messages");
  everyone.now.createPopup("Here is a popup");
}

everyone.now.setNewLayer = function(){
 console.log(this.now.newlayerinfo);

}



// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port)
}
