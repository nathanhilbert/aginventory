
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




//The now configuration

var nowjs = require('now');
var everyone = nowjs.initialize(app);

/*
Hopefully nowjs can figure out when a group is empty to delete it.  This could be a major memory leak.

*/

nowjs.on('disconnect', function(){
 	console.log("we were able tog et the mapid " + this.user.clientId);
	nowjs.getGroup(this.now.mapid).count(function(ct){
		console.log("Now there is this many here " + ct);
	});
});



nowjs.on('connect', function(){
	console.log("heres the users cookie " + util.inspect(this.user.cookie));
	console.log("here is some other stuff " + util.inspect(this.user));
	//console.log("we were able tog et the mapid " + this.user.clientId);
	//nowjs.getGroup(this.now.mapid).count(function(ct){
	//	console.log("there are this many members in the group on coming here " + ct);
	//});

});




everyone.now.serverCheckUser = function(username, challenge, mapid){
	var theuserid = this;
	console.log("got my mapid: " + mapid);

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
	console.log("ok at least hit the function");
	mydb.connect(function(error){ if(error) {console.log("there was a major error with mysql" + error);}
		myconnection = this;
		myconnection.query("SELECT uid FROM users WHERE username=? AND mapid=? LIMIT 1", [username, mapid]).execute(function(error,rows1){
			if(error){console.log("there was an error in sql " + error)}
			if (rows1.length == 1){
					myconnection.query("SELECT uid FROM users WHERE username=? AND challenge=? AND mapid=? LIMIT 1", [username, challenge, mapid]).execute(function(error, rows2){
						if(error){console.log(error);}
						if (rows2.length == 1){
							//console.log("at least runnign the sql as well");
						
							myconnection.query("UPDATE users SET login=UNIX_TIMESTAMP() WHERE uid=? AND mapid=?", [rows2[0]['uid'], mapid]).execute(function(error){if (error){console.log(error)}});
							theuserid.now.mapid = mapid;
							theuserid.now.clientCheckUser(true, rows2[0]['uid']);
							nowjs.getGroup(mapid).addUser(theuserid.user.clientId);
							nowjs.getGroup(mapid).count(function(ct){
								console.log("this makes this many in the group is " + ct);
							});
						}
						else {
							theuserid.now.clientCheckUser(false, 'newUserCheck', 'Either a user already has this user name or your password is in correct.  If you have signed in before with this user name please try to enter your street name again.');
						}
					});
			
			} else{
					myconnection.query("INSERT INTO users SET username=?, challenge=?, created=UNIX_TIMESTAMP(), login=UNIX_TIMESTAMP(), mapid=?", [username, challenge, mapid]).execute(function(error){  if (error){console.log(error)}
							myconnection.query("SELECT MAX(uid) as maxuserid FROM users").execute(function(error, rows3){
								if (error){console.log(error)}
								theuserid.now.mapid = mapid;
								console.log("stopping here");
								theuserid.now.clientCheckUser(true, rows3[0]['maxuserid']);
								nowjs.getGroup(mapid).addUser(theuserid.user.clientId);
								nowjs.getGroup(mapid).count(function(ct){
									console.log("this makes this many in the group is " + ct);
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

var sendFeatures = function(theuserid, myconnection, therows){
	var thesend = {'layerid':therows['layerid'], 'layertitle':therows['layername'], 'layertype':therows['type'],'shape':therows['shape'],  'color':therows['color']};
	theuserid.now.clientNewLayer(JSON.stringify(thesend));
	console.log("snet the client layer");
//now adding the features for each
	myconnection.query("SELECT data, shapeid FROM mapdata WHERE layerid=?",[therows['layerid']]).execute(function(error, datarows){
		if (error){console.log(error);}
		var datasend = [];
		for (var i =0;i< datarows.length;i++){
			var newobj = JSON.parse(datarows[i]['data']);
			newobj['properties']['shapeid'] = datarows[i]['shapeid'];				
			datasend.push(newobj);
		}
		theuserid.now.clientAddFeature(datasend);
	});

}

everyone.now.populateMap = function(mapid){
//calls one function for each of the layers that are part of this map with the JSON encoded data
//could maybe user jquery progress bar here.
	console.log("populate is now doing its thing");
	var theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		var myconnection = this;
		myconnection.query("SELECT layerid, layername, type, color, shape FROM maplayers WHERE mapid=?", [theuserid.now.mapid]).execute(function(error, rows){
			if(error){console.log(error);}
			for (var x=0;x<rows.length;x++){
				
				sendFeatures(theuserid, myconnection, rows[x]);
			}
			console.log("now getting to finish pouplate for clietn");
			theuserid.now.clientFinishPopulate();
		});
	});
	
//takes straight up geoJson that is stored in database

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
		myconnection = this;
		if (!queryobj['shape']){queryobj['shape']='none';}
		myconnection.query("INSERT INTO maplayers SET layername=?, type=?, color=?, shape=?, mapid=?, uid=?", [queryobj['layertitle'] ,queryobj['layertype'],queryobj['picker'],queryobj['symbol'],theuserid.now.mapid, theuserid.now.uid ]).execute(function(error){if (error){console.log(error);}
			myconnection.query("SELECT MAX(layerid) as maxlayerid FROM maplayers").execute(function(error2, rows){
				if (error2){console.log(error2);}
				thelayerid = rows[0]['maxlayerid'];
				//console.log("Here is the layerid " + rows[0]['maxlayerid']);
				console.log(queryobj['menuattributes']);
				var thestring = queryobj['menuattributes'].replace(/\\/g,'');
				console.log(thestring);
				var attributeobj = JSON.parse(thestring);
				console.log(util.inspect(attributeobj));
				for (thekey in attributeobj){
					//var stringed = JSON.stringify(attributeobj[thekey]);
					//console.log(stringed);
					if (!attributeobj[thekey]['options']) {attributeobj[thekey]['options'] = "none";}
					if (!attributeobj[thekey]['rows']) {attributeobj[thekey]['rows'] = "none";}
					if (!attributeobj[thekey]['required']) {attributeobj[thekey]['required'] = "false";}
					if (!attributeobj[thekey]['label']) {attributeobj[thekey]['label'] = "";}
					execstring = "INSERT INTO mapatts SET label='" + attributeobj[thekey]['label'] + "', name='" + thekey + "', type='" + attributeobj[thekey]['type'] + "', rows='"+ attributeobj[thekey]['rows'] + "', options='" + JSON.stringify(attributeobj[thekey]['options']) + "', required='" + attributeobj[thekey]['required'] + "', layerid=" + thelayerid;
					console.log(execstring);
					myconnection.query(execstring).execute(function(error){if(error){console.log(error);}});
				}
				sendback = {'layerid':thelayerid, 'layertitle': queryobj['layertitle'], 'layertype':queryobj['layertype'], 'shape':queryobj['shape'], 'color': queryobj['picker']};
				nowjs.getGroup(theuserid.now.mapid).now.clientNewLayer(JSON.stringify(sendback));
			});
		});
	}); 


}



everyone.now.serverAddFeature = function(thejson, attributes){
	var geoparse = JSON.parse(thejson);
	//console.log(geoparse['properties']['layer'] + " with the mapid " + this.now.mapid);
	var theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		var theconnection = this;
		var thelayerid = null;
		var query1 = "SELECT layerid, color, shape, type FROM maplayers WHERE layername=? AND mapid=? LIMIT 1";
		//console.log("Here is query1 " + query1);
		theconnection.query(query1, [geoparse['properties']['layer'], theuserid.now.mapid]).execute(function(theerror, rows){
			if(theerror || !(rows.length > 0)){console.log(theerror);}
			//console.log(util.inspect(rows));
			console.log(util.inspect(rows));
			console.log("here is the layer id " + rows[0]['layerid']);
			
			var thelayerid = rows[0]['layerid'];
			var thecolor = rows[0]['color'];
			var thegraphic = rows[0]['shape'];
			var layertype = rows[0]['type'];
		
			var query2 = "INSERT INTO mapdata SET data=?, layerid=?";
			//console.log("Here is query1 " + query2);
			theconnection.query(query2, [thejson, thelayerid]).execute(function(error3){if (error3){console.log(error3);}
				var theshapeid = 0;
				theconnection.query("SELECT MAX(shapeid) as maxshape FROM mapdata").execute(function(error2,rows2){
					if(error2){console.log(error2);}
					theshapeid = rows2[0]['maxshape'];
					geoparse['properties']['shapeid'] = theshapeid;
						if(thegraphic == 'none' && layertype=='point'){
							geoparse['properties']['graphic'] = "circle";	
						}
						else{
							geoparse['properties']['graphic'] = thegraphic;	
						}
						geoparse['properties']['color'] = thecolor;
					nowjs.getGroup(theuserid.now.mapid).now.clientAddFeature(geoparse);
				
//starting the attributes of the data
					console.log("here are the attributes " + attributes);
					var attparse = querystring.parse(attributes);
					console.log(util.inspect(attparse));
					attkeys = [];


					for (item in attparse){
						iterkeys(item,attparse[item], theshapeid, thelayerid, theconnection) ;
					}
				});
			});
		});
		
	});
}
var iterkeys = function(theitem, thedata, theshapeid, thelayerid, theconnection){
	theconnection.query("SELECT atid FROM mapatts WHERE name=? AND layerid=?" , [theitem,thelayerid]).execute(function(error, rows3){
		if(error){console.log(error);}
		console.log(util.inspect(rows3));
		console.log(theitem + " with this " + thedata);
		if (rows3.length > 0){ 
			var theattid = rows3[0]['atid'];
			theconnection.query("DELETE FROM mapattdata WHERE atid=? AND shapeid=?" , [theattid, theshapeid]).execute(function(error){
				if(error){console.log(error);}

		
				theconnection.query("INSERT INTO mapattdata SET atid=?, shapeid=?, data=?", [theattid, theshapeid, thedata]).execute(function(error){
					if(error){console.log(error);}
				});
			});
		}
	});
}



everyone.now.serverDeleteFeature = function(delobj){
	shapeid = delobj['shapeid'];
	//console.log("here is the shape id for deleting " + shapeid);
	theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		myconnection = this;
		myconnection.query("DELETE FROM mapdata WHERE shapeid=?", [shapeid]).execute(function(error){if(error){console.log(error);}});
		myconnection.query("DELETE FROM mapattdata WHERE shapeid=?", [shapeid]).execute(function(error){if(error){console.log(error);}});
		nowjs.getGroup(theuserid.now.mapid).now.clientDeleteFeature(delobj);
	});
}
everyone.now.serverModifyFeature = function(thejson){
	var featureobj = JSON.parse(thejson);
	var shapeid = featureobj['properties']['shapeid'];
	theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		myconnection = this;

		var query1 = "SELECT layerid FROM maplayers WHERE layername=? AND mapid=? LIMIT 1";
		myconnection.query(query1, [featureobj['properties']['layer'] , theuserid.now.mapid]).execute(function(error, rows){if(error){console.log(error);}
			if (rows.length >0){
				myconnection.query("UPDATE mapdata SET data=? WHERE layerid=? AND shapeid=?" , [thejson, rows[0]['layerid'], shapeid]).execute(function(error){
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

everyone.now.serverGetAttributes = function(shapeid, layer){
	theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		myconnection = this;

		var query1 = "SELECT mapattdata.data, mapatts.label  FROM mapattdata INNER JOIN mapatts ON mapattdata.atid=mapatts.atid LEFT JOIN maplayers ON mapatts.layerid=maplayers.layerid WHERE mapattdata.shapeid=? AND mapid=? AND maplayers.layername=?";
		//console.log(query1);
		myconnection.query(query1, [shapeid, theuserid.now.mapid, layer]).execute(function(error, rows){if(error){console.log(error);}
			thehtml = "";
			for (var y =0; y<rows.length; y++){
				if (rows[y]['label'] != ""){
					thehtml += "<strong>" + rows[y]['label'] + " :</strong>";
				}
				thehtml += rows[y]['data'] +"<br/>";
			}
			
			theuserid.now.clientGetAttributes(thehtml);
		});
	});

}


everyone.now.serverUpdateAttributes = function(attributes, shapeid, layername){
	theuserid = this;
	mydb.connect(function(error){if (error){console.log(error)}
		theconnection = this;
	
		theconnection.query("SELECT layerid FROM maplayers WHERE layername=? LIMIT 1", [layername]).execute(function(error2,rows2){
			if(error2){console.log(error2);}
			thelayerid = rows2[0]['layerid'];
		
	//starting the attributes of the data
			//console.log("here are the attributes " + attributes);
			var attparse = querystring.parse(attributes);
			//console.log(util.inspect(attparse));
			attkeys = [];


			for (item in attparse){
				iterkeys(item,attparse[item], shapeid, thelayerid, theconnection) ;
			}
		});
	});

}

//var defaultAttributes = '{ "title": {"label":"Title", "required": true, "type":"textfield"}, "description":{"label":"", "type": "textarea", "required":true, "rows":6}, "moreoptions":{"label":"Something", "type":"select", "options":{"option1":"option1", "option2":"option2"}}}';
//var defaultAttributes = '{"title":"something"}';

everyone.now.serverGetAttributeForm = function(layername, shapeid){
  var thehtml = "<form action='#' id='attributeForm'>";
  var formObj = {};
	theuserid = this;
  //var utils = require('util');
  //console.log(utils.inspect(formObj));
	mydb.connect(function(error){if (error){console.log(error)}
		myconnection = this;
		myconnection.query("SELECT mapatts.label, mapatts.name, mapatts.type, mapatts.rows, mapatts.required, mapatts.options FROM mapatts LEFT JOIN maplayers ON mapatts.layerid=maplayers.layerid WHERE maplayers.layername=? AND maplayers.mapid=?", [layername, theuserid.now.mapid]).execute(function(error, rows){
			if(error){console.log(error)}
			for (var u=0; u<rows.length; u++){
				formObj[rows[u]['name']] = {'label':rows[u]['label'], 'type':rows[u]['type'], 'rows':rows[u]['rows'], 'required':rows[u]['required'], 'options':rows[u]['options']};
			}


		var createHTML = function(formObj, theuserid, shapeid){
				  for (item in formObj){
				    //console.log(utils.inspect(formObj[item]));
				    var workingobj = formObj[item];
				    if (formObj[item]['label'] != '' || formObj[item]['label'] != null){
				      thehtml += formObj[item]['label'];
						thehtml += "<br/>";
				    }
				    if (workingobj['type'] == 'textarea'){
				      thehtml += "<textarea id='" + item + "' name='" + item + "' ";
				      if (workingobj['rows']){thehtml += "rows='" + workingobj['rows'] + " ";}
				      if (workingobj['required'] == "true"){
							thehtml += "class='validate[required]'"
				      }
				      thehtml += ">"
						if(workingobj['value']){
							thehtml += workingobj['value'];
						}
						thehtml += "</textarea>"
				    }
				    else if (workingobj['type'] == 'select'){
				      thehtml += "<select id='" + item + "' name='" + item + "' ";
				      if (workingobj['required'] == "true"){
				        thehtml = " class='validate[required]'";
				      }
						if(workingobj['value']){
							thehtml += " value='" + workingobj['value'] + "' ";
						}
						thehtml += ">";
						console.log(workingobj['options']);
						optionsobj = JSON.parse(workingobj['options']);
				      for (selectobj in optionsobj){
							console.log("adding <option value='" + selectobj + "'>" + optionsobj[selectobj] + "</option>");
							thehtml += "<option value='" + selectobj + "'>" + optionsobj[selectobj] + "</option>";
				      } 
				      thehtml += "</select>";
				    }
				    else { //(workingobj['type'] == 'textfield'){
				      thehtml += "<input id='" + item + "' name='" + item + "'type='text' ";
				      if (workingobj['required'] == "true"){
							thehtml += "class='validate[required]'";
				      }
						if(workingobj['value']){
							thehtml += " value='" + workingobj['value'] + "' ";
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
				  theuserid.now.clientGetAttributeForm(thehtml, shapeid);
		}

			if (shapeid){
				console.log("doing the shapeid with " + shapeid);
				var query1 = "SELECT mapattdata.data, mapatts.name  FROM mapattdata INNER JOIN mapatts ON mapattdata.atid=mapatts.atid LEFT JOIN maplayers ON mapatts.layerid=maplayers.layerid WHERE mapattdata.shapeid=? AND mapid=? AND maplayers.layername=?";
				myconnection.query(query1, [shapeid, theuserid.now.mapid, layername]).execute(function(error, rows2){
					console.log(util.inspect(rows2));
					if(error){console.log(error);}
					for (var t =0; t<rows2.length; t++){
						formObj[rows2[t]['name']]['value'] = rows2[t]['data'];
					}
					createHTML(formObj, theuserid, shapeid);
				});
			}
			else{
				createHTML(formObj, theuserid);
			}


		});
	});
}

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3300);
  console.log("Express server listening on port %d", app.address().port)
}
