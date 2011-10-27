
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

/*
nowjs.on('connect', function(){
  console.log("Joined: " + this.now.name);
});
*/


everyone.now.distributeMessage = function(message){
  console.log("here is the message: " + message);
  everyone.now.recieveMessage("nothing", "morre messages");
  everyone.now.createPopup("Here is a popup");
}

everyone.now.serverNewLayer = function(){
  console.log(this.now.username + " Wants to add this layer: " + this.now.newlayerinfo);
  //var util = require('util');
  var querystring = require('querystring');
  util.inspect(querystring);
  var queryobj = querystring.parse(this.now.newlayerinfo);
  //console.log(util.inspect(queryobj));  
//need to add this to the database
  everyone.now.clientNewLayer(JSON.stringify(queryobj));
}

//do a quick query about the persisitent data for the max number
everyone.now.maxfeatureid = 1;

everyone.now.serverAddFeature = function(json){
  everyone.now.maxfeatureid++;
//Need to add to the server
  everyone.now.clientAddFeature(json);
  return;
}

var defaultAttributes = '{ "title": {"label":"Title", "required": true, "type":"textfield"}, "description":{"label":"", "type": "textarea", "required":true, "rows":6}, "moreoptions":{"label":"Something", "type":"select", "options":{"option1":"option1", "option2":"option2"}}, "checkboxes": {"required":true, "type": "checkboxes", "options":{"option1":"option1", "option2":"option2"}}}';
//var defaultAttributes = '{"title":"something"}';

everyone.now.serverDeleteFeature = function(json){
  everyone.now.clientDeleteFeature(json);
  return;
}
everyone.now.serverModifyFeature = function(json){
  everyone.now.clientModifyFeature(json);
  return;
}

everyone.now.serverGetAttributeForm = function(){
  var thehtml = "<form action='#' id='attributeForm'>";
  console.log(defaultAttributes);
  var formObj = JSON.parse(defaultAttributes);
  //var utils = require('util');
  //console.log(utils.inspect(formObj));
  for (item in formObj){
    //console.log(utils.inspect(formObj[item]));
    var workingobj = formObj[item];
    if (formObj[item]['label'] != '' || formObj[item]['label'] != null){
      thehtml += formObj[item]['label'];
    }
    if (workingobj['type'] == 'textfield'){
      thehtml += "<input id='" + item + "' type='text' ";
      if (workingobj['required'] == true){
	thehtml += "class='validate[required]'";
      }
      thehtml += "/>";
    }
    else if (workingobj['type'] == 'textarea'){
      thehtml += "<textarea id='" + item + "' ";
      if (workingobj['rows']){thehtml += "rows='" + workingobj['rows'] + " ";}
      if (workingobj['required'] == true){
	thehtml += "class='validate[required]'"
      }
      thehtml += "</textarea>"
    }
    else if (workingobj['type'] == 'select'){
      thehtml += "<select id='" + item + "' ";
      if (workingobj['required'] == true){
        thehtml = " class='validate[required]'>";
      }
      for (selectobj in workingobj['options']){
	thehtml += "<option value='" + selectobj + "'>" + workingobj['options'][selectobj] + "</option>";
      } 
      thehtml += "</select>";
    }
    else if (workingobj['type'] == 'checkboxes'){
      for (selectobj in workingobj['options']){
        thehtml += "<input type='checkbox' id='" + item + "' ";
        //no required becuase nothing is required for checkboxes
	thehtml += "value='" + selectobj + "'/>" + workingobj['options'][selectobj] + "<br/>";
      }
    }
    thehtml += "<br/>";
  }
  thehtml += "<input type='submit' value='Save'/></form>";
  this.now.clientGetAttributeForm(thehtml);
  return;

}

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port)
}
