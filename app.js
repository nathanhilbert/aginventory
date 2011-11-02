
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

//other modules

var mysql = require('db-mysql');
mydb = new mysql.Database({
	hostname: 'localhost',
   	user: 'root',
	password: 'Ti4yM2si',
	database: 'aginven'
})

var check = require('validator').check;
var santitize = require('validator').sanitize;
var querystring = require('querystring');

//development

var util = require('util');


// Routes

app.get('/:id', function(req, res){
  res.render('map', {
    locals: {
      title: 'The Map'
    }
  });
  
});

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
Hopefully nowjs can figure out when a group is empty to delete it.  This could be a major memory leak.

nowjs.on('disconnect', function(){
  getGroups(function(groups){
		

  });
});
*/


everyone.now.serverCheckUser = function(username, challenge, mapid){
	var theuserid = this;
	//console.log("got my mapid: " + mapid);
	try {
		check(username).isAlphanumeric();
	}
	catch (e){
		theuserid.now.clientCheckUser(false, 'newNameFormUsername','Please user only letters and numbers for your username');
		console.log("got this error in the isAlphanumeric " + e.message);
		return;
	}
	try {
		check(challenge).isAlphanumeric();
	}
	catch (e){
		theuserid.now.clientCheckUser(false, 'newUserCheck', 'Please user only letters and numbers for your street name');
		console.log("got this error in the isAlphanumeric " + e.message);
		return;
	}
	//console.log("got through validation now we are runing queries");
	mydb.connect(function(error){ if(error) {console.log("there was a major error with mysql" + error);}
		this.query("SELECT uid FROM users WHERE username='" + username + "' AND mapid='" + mapid + "' LIMIT 1").execute(function(error,rows1){
			if(error){console.log("there was an error in sql " + error)}
			if (rows1.length == 1){
				mydb.connect(function(error){ if (error){console.log(error)}
					this.query("SELECT uid FROM users WHERE username='" + username + "' AND challenge='" + challenge + "' AND mapid='" + mapid + "' LIMIT 1").execute(function(error, rows2){
						if(error){console.log(error);}
						if (rows2.length == 1){
							mydb.connect(function(error){
								this.query("UPDATE users SET login=UNIX_TIMESTAMP() WHERE uid=" +rows2[0]['uid'] + " AND mapid='" + mapid + "'").execute(function(error){if (error){console.log(error)}});
							});
							nowjs.getGroup(mapid).addUser(theuserid.user.clientId);
							theuserid.now.mapid = mapid;
							theuserid.now.clientCheckUser(true, rows2[0]['uid']);
						}
						else {
							theuserid.now.clientCheckUser(false, 'newUserCheck', 'Either a user already has this user name or your password is in correct.  If you have signed in before with this user name please try to enter your street name again.');
						}
					});
				});
			} else {
				mydb.connect(function(error){
					this.query("INSERT INTO users SET username='" + username + "', challenge='" + challenge + "', created=UNIX_TIMESTAMP(), login=UNIX_TIMESTAMP(), mapid='"+ mapid +"'").execute(function(error){  if (error){console.log(error)}
						mydb.connect(function(error){
							this.query("SELECT MAX(uid) as maxuserid FROM users").execute(function(error, rows3){
								if (error){console.log(error)}
								nowjs.getGroup(mapid).addUser(theuserid.user.clientId);
								theuserid.now.mapid = mapid;
								theuserid.now.clientCheckUser(true, rows3[0]['maxuserid']);
							});
						});
					});
				});
			}
		});
	});
}
/*

	sendback = {'layerid':thelayerid, 'layertitle': queryobj['layertitle'], 'layertype':queryobj['layertype'], 'shape':queryobj['shape'], 'color': queryobj['picker']};
  nowjs.getGroup(this.now.mapid).now.clientNewLayer(JSON.stringify(sendback));
*/

everyone.now.populateMap = function(mapid){
//calls one function for each of the layers that are part of this map with the JSON encoded data
//could maybe user jquery progress bar here.
	var theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		var myconnection = this;
		myconnection.query("SELECT layerid, layername, type, color, shape FROM maplayers WHERE mapid='" + theuserid.now.mapid + "'").execute(function(error, rows){
			if(error){console.log(error);}
			for (var x=0;x<rows.length;x++){
				var thesend = {'layerid':rows[x]['layerid'], 'layertitle':rows[x]['layername'], 'layertype':rows[x]['type'],'shape':rows[x]['shape'],  'color':rows[x]['color']};
				theuserid.now.clientNewLayer(JSON.stringify(thesend));
//now adding the features for each
				myconnection.query("SELECT data, shapeid FROM mapdata WHERE layerid=" + rows[x]['layerid']).execute(function(error, datarows){
					if (error){console.log(error);}
					datasend = [];
					for (var i =0;i< datarows.length;i++){
						var newobj = JSON.parse(datarows[i]['data']);
						newobj['properties']['shapeid'] = datarows[i]['shapeid'];
						datasend.push(newobj);
					}
					theuserid.now.clientAddFeature(datasend);
				});
			}
			theuserid.now.clientFinishPopulate();
		});
	});
	
//takes straight up geoJson that is stored in database

}


everyone.now.distributeMessage = function(message){
  console.log("here is the message: " + message);
  everyone.now.recieveMessage("nothing", "morre messages");
  everyone.now.createPopup("Here is a popup");
}

everyone.now.serverNewLayer = function(thequerystring){
  //console.log(this.now.username + " Wants to add this layer: " + this.now.newlayerinfo);
  //var util = require('util');
  
  var thelayerid = 0;
  var theuserid = this;
  //util.inspect(querystring);
  var queryobj = querystring.parse(thequerystring);
  mydb.connect(function(error){if(error){console.log(error);}
//NEED to verify that this layer name is not being added will do later, since I am adding all of the layers
		if (!queryobj['shape']){queryobj['shape']='none';}
		this.query("INSERT INTO maplayers SET layername='" + queryobj['layertitle'] + "', type='" + queryobj['layertype'] + "', color='" + queryobj['picker'] + "', shape='" + queryobj['shape'] + "', mapid='" + theuserid.now.mapid + "', uid='" + theuserid.now.uid + "'").execute(function(error){if (error){console.log(error);}});
		this.query("SELECT MAX(layerid) as maxlayerid FROM maplayers").execute(function(error2, rows){
			if (error2){console.log(error2);}
			thelayerid = rows[0]['maxlayerid'];
			console.log("Here is the layerid " + rows[0]['maxlayerid']);
			mydb.connect(function(error){if(error){console.log(error);}
				
				var thestring = queryobj['menuattributes'].replace(/\\/g,'');
				//console.log(thestring);
				var attributeobj = JSON.parse(thestring);
				//console.log(util.inspect(attributeobj));
				for (thekey in attributeobj){
					//var stringed = JSON.stringify(attributeobj[thekey]);
					//console.log(stringed);
					if (!attributeobj[thekey]['options']) {attributeobj[thekey]['options'] = "none";}
					if (!attributeobj[thekey]['rows']) {attributeobj[thekey]['rows'] = "none";}
					if (!attributeobj[thekey]['required']) {attributeobj[thekey]['required'] = "false";}
					execstring = "INSERT INTO mapatts SET name='" + thekey + "', type='" + attributeobj[thekey]['type'] + "', rows='"+ attributeobj[thekey]['rows'] + "', options='" + querystring.stringify(attributeobj[thekey]['options']) + "', required='" + attributeobj[thekey]['required'] + "', layerid=" + thelayerid;
					console.log(execstring);
					this.query(execstring).execute(function(error){if(error){console.log(error);}});
				}
			});
		});
	}); 

//need to add this to the database
	sendback = {'layerid':thelayerid, 'layertitle': queryobj['layertitle'], 'layertype':queryobj['layertype'], 'shape':queryobj['shape'], 'color': queryobj['picker']};
  nowjs.getGroup(this.now.mapid).now.clientNewLayer(JSON.stringify(sendback));
}



everyone.now.serverAddFeature = function(thejson, attributes){
	var geoparse = JSON.parse(thejson);
	//console.log(geoparse['properties']['layer'] + " with the mapid " + this.now.mapid);
	var theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		var theconnection = this;
		var thelayerid = null;
		var query1 = "SELECT layerid FROM maplayers WHERE layername='" + geoparse['properties']['layer'] + "' AND mapid='" + theuserid.now.mapid + "' LIMIT 1";
		console.log("Here is query1 " + query1);
		theconnection.query(query1).execute(function(theerror, rows){
			if(theerror){console.log(theerror);}
			//console.log(util.inspect(rows));
			console.log("here is the layer id " + rows[0]['layerid']);
			thelayerid = rows[0]['layerid'];
		
			var query2 = "INSERT INTO mapdata SET data='" + thejson + "', layerid=" + thelayerid;
			console.log("Here is query1 " + query2);
			theconnection.query(query2).execute(function(error3){if (error3){console.log(error3);}
				var theshapeid = 0;
				theconnection.query("SELECT MAX(shapeid) as maxshape FROM mapdata").execute(function(error2,rows2){
					if(error2){console.log(error2);}
					theshapeid = rows2[0]['maxshape'];
					geoparse['properties']['shapeid'] = theshapeid;
					nowjs.getGroup(theuserid.now.mapid).now.clientAddFeature(geoparse);
				
//starting the attributes of the data
					console.log("here are the attributes " + attributes);
					var attparse = querystring.parse(attributes);
					console.log(util.inspect(attparse));
					for (item in attparse){
						var theattid = 0;
						console.log(item + " with this " + attparse[item]);
						theconnection.query("SELECT atid FROM mapatts WHERE name='" + item + "' AND layerid=" + thelayerid).execute(function(error, rows3){
							if(error){console.log(error);}
							console.log(util.inspect(rows3));
							if (rows3.length > 0){ 
								theattid = rows3[0]['atid'];
							
								theconnection.query("INSERT INTO mapattdata SET atid=" + theattid + ", shapeid=" + theshapeid + ", data='" + attparse[item] + "'").execute(function(error){
									if(error){console.log(error);}
								});
							}
						});
					}	
				});
			});
		});
		
	});
}

var defaultAttributes = '{ "title": {"label":"Title", "required": true, "type":"textfield"}, "description":{"label":"", "type": "textarea", "required":true, "rows":6}, "moreoptions":{"label":"Something", "type":"select", "options":{"option1":"option1", "option2":"option2"}}}';
//var defaultAttributes = '{"title":"something"}';

everyone.now.serverDeleteFeature = function(delobj){
	shapeid = delobj['shapeid'];
	console.log("here is the shape id for deleting " + shapeid);
	theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		myconnection = this;
		myconnection.query("DELETE FROM mapdata WHERE shapeid=" + shapeid).execute(function(error){if(error){console.log(error);}});
		myconnection.query("DELETE FROM mapattdata WHERE shapeid=" + shapeid).execute(function(error){if(error){console.log(error);}});
		nowjs.getGroup(theuserid.now.mapid).now.clientDeleteFeature(delobj);
	});
}
everyone.now.serverModifyFeature = function(thejson){
	var featureobj = JSON.parse(thejson);
	var shapeid = featureobj['properties']['shapeid'];
	console.log("here is the shape id for modifying " + shapeid);
	theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		myconnection = this;

		var query1 = "SELECT layerid FROM maplayers WHERE layername='" + featureobj['properties']['layer'] + "' AND mapid='" + theuserid.now.mapid + "' LIMIT 1";
		myconnection.query(query1).execute(function(error, rows){if(error){console.log(error);}
			if (rows.length >0){
				myconnection.query("UPDATE mapdata SET data='" + thejson + "' WHERE layerid=" + rows[0]['layerid'] + " AND shapeid=" + shapeid).execute(function(error){
					if(error){console.log(error);}
				});
			}
			else {
				console.log("there was an error in finding the layerid");
			}
		});

		nowjs.getGroup(theuserid.now.mapid).now.clientModifyFeature(featureobj);
	});
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
    if (workingobj['type'] == 'textarea'){
      thehtml += "<textarea id='" + item + "' name='" + item + "' ";
      if (workingobj['rows']){thehtml += "rows='" + workingobj['rows'] + " ";}
      if (workingobj['required'] == true){
			thehtml += "class='validate[required]'"
      }
      thehtml += "></textarea>"
    }
    else if (workingobj['type'] == 'select'){
      thehtml += "<select id='" + item + "' name='" + item + "' ";
      if (workingobj['required'] == true){
        thehtml = " class='validate[required]'>";
      }
      for (selectobj in workingobj['options']){
	thehtml += "<option value='" + selectobj + "'>" + workingobj['options'][selectobj] + "</option>";
      } 
      thehtml += "</select>";
    }
    else { //(workingobj['type'] == 'textfield'){
      thehtml += "<input id='" + item + "' name='" + item + "'type='text' ";
      if (workingobj['required'] == true){
	thehtml += "class='validate[required]'";
      }
      thehtml += "/>";
    }
/*
    else if (workingobj['type'] == 'checkboxes'){
      for (selectobj in workingobj['options']){
        thehtml += "<input type='checkbox' id='" + item + "' name='" + item + "' ";
        //no required becuase nothing is required for checkboxes
	thehtml += "value='" + selectobj + "'/>" + workingobj['options'][selectobj] + "<br/>";
      }
    }
*/
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
