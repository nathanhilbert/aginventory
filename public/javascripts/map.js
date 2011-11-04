// JavaScript Document




var googlelayer, map, normalproj, mercator, node_layer, edge_layer, myredraw, selectControlNodes, dir_layer, selectedFeatures, updatetimer, hoverControlNodes, timeOut, currentpopup, ismin;

//var now;
var layerswitcher, layers, activeControl, activeDrawLayer, activePopup, tempFeature;
var handlerArray = {};

var onscreenfeatures = [];



/***************TO DO LIST
1. 






*/

//******************************End layer class*********************************************************
//*****************************OL override functions ************************************************

OpenLayers.Control.LayerSwitcher.prototype.redraw = function(){
   //if the state hasn't changed since last redraw, no need 
        // to do anything. Just return the existing div.
        if (!this.checkRedraw()) { 
            return this.div; 
        } 

        //clear out previous layers 
        this.clearLayersArray("base");
        this.clearLayersArray("data");
        
        var containsOverlays = false;
        var containsBaseLayers = false;
        
        // Save state -- for checking layer if the map state changed.
        // We save this before redrawing, because in the process of redrawing
        // we will trigger more visibility changes, and we want to not redraw
        // and enter an infinite loop.
        var len = this.map.layers.length;
        this.layerStates = new Array(len);
        for (var i=0; i <len; i++) {
            var layer = this.map.layers[i];
            this.layerStates[i] = {
                'name': layer.name, 
                'visibility': layer.visibility,
                'inRange': layer.inRange,
                'id': layer.id
            };
        }    

        var layers = this.map.layers.slice();
        if (!this.ascending) { layers.reverse(); }
        for(var i=0, len=layers.length; i<len; i++) {
            var layer = layers[i];
            var baseLayer = layer.isBaseLayer;

            if (layer.displayInLayerSwitcher) {

                if (baseLayer) {
                    containsBaseLayers = true;
                } else {
                    containsOverlays = true;
                }    

                // only check a baselayer if it is *the* baselayer, check data
                //  layers if they are visible
                var checked = (baseLayer) ? (layer == this.map.baseLayer)
                                          : layer.getVisibility();
    
                // create input element
                var inputElem = document.createElement("input");
                inputElem.id = this.id + "_input_" + layer.name;
                inputElem.name = (baseLayer) ? this.id + "_baseLayers" : layer.name;
                inputElem.type = (baseLayer) ? "radio" : "checkbox";
                inputElem.value = layer.name;
                inputElem.checked = checked;
                inputElem.defaultChecked = checked;

                if (!baseLayer && !layer.inRange) {
                    inputElem.disabled = true;
                }
                var context = {
                    'inputElem': inputElem,
                    'layer': layer,
                    'layerSwitcher': this
                };
                OpenLayers.Event.observe(inputElem, "mouseup", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );
                
                // create span
                var labelSpan = document.createElement("span");
                OpenLayers.Element.addClass(labelSpan, "labelSpan");
                if (!baseLayer && !layer.inRange) {
                    labelSpan.style.color = "gray";
                }
                labelSpan.innerHTML = layer.name;
                labelSpan.style.verticalAlign = (baseLayer) ? "bottom" 
                                                            : "baseline";
                OpenLayers.Event.observe(labelSpan, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );
                // create line break
                var br = document.createElement("br");
    
                
                var groupArray = (baseLayer) ? this.baseLayers
                                             : this.dataLayers;
                groupArray.push({
                    'layer': layer,
                    'inputElem': inputElem,
                    'labelSpan': labelSpan
                });
                                                     
    
                var groupDiv = (baseLayer) ? this.baseLayersDiv
                                           : this.dataLayersDiv;
                groupDiv.appendChild(inputElem);
                groupDiv.appendChild(labelSpan);
                groupDiv.appendChild(br);
            }
        }

        // if no overlays, dont display the overlay label
        this.dataLbl.style.display = (containsOverlays) ? "" : "none";        
        
        // if no baselayers, dont display the baselayer label
        this.baseLbl.style.display = (containsBaseLayers) ? "" : "none";        

	appendLayerMenu();
        return this.div;


}








//****************************STYLIZE FUNCTIONS ********************************************************

    
    var stylize = function(){
        
        var nodestylertemp = OpenLayers.Util.applyDefaults({
                 strokeWidth: 1.5,
                 strokeColor: "${color}",
                 strokeOpacity:.9,
                 fillColor: "${color}",
                 fillOpacity: .4,
                 cursor: "pointer",
                 pointRadius: 7,
                 display:"",
					  //graphicName: "${graphic}",
					  //label: "${thelabel}"
             }, OpenLayers.Feature.Vector.style['temporary']);
        var nodestylerselect = OpenLayers.Util.applyDefaults({
                 strokeWidth: 1.5,
                 strokeColor: "#FAF334",
                 strokeOpacity:.9,
                 fillColor: "#FAF334",
                 fillOpacity: .4,
                 cursor: "pointer",
                 pointRadius: 7,
                 display:"",
					  //graphicName: "${graphic}",
					  //label: "${thelabel}"
             }, OpenLayers.Feature.Vector.style['select']);
                          
        var thestyle = new OpenLayers.Style({
                 strokeWidth: 1,
                 strokeColor: "${color}",
                 fillColor: "${color}",
                 strokeOpacity:1,
                 fillOpacity: .9,
                 cursor: "pointer",
                 pointRadius: 7,
                 display:"",
					  //graphicName: "${graphic}",
					  //label: "${thelabel}"
             });



        return new OpenLayers.StyleMap({'default':thestyle, 'select':nodestylerselect, 'temporary':nodestylertemp}); 
        
    }  



    //symbolizer: {graphicName:"arrow",rotation : "${angle}", fillOpacity: 0.7, fillColor: "#7CFC00",  strokeColor: "#7CFC00"}
    
    








//******************************Action Handler **********************************************************



    
var updatetoolbar = function(){
    clearTimeout(updatetimer);
    updatetimer = null;
    itemlimit = ["J","I","H","G","F","E","D","C","B","A"]
    $(".buscasetag").remove();
    $(".toolbarmenu").remove();
    var selectedbcids = []; 
    //$("#toolbarcontents").append($("<span id='toolbarmin'>").html('<img src="/sites/all/modules/businessclustermap/image/layer-switcher-minimize.jpg" style="width:18px;height:18px">'));
    var nodestyler = OpenLayers.Util.applyDefaults({
             strokeWidth: 3,
             strokeOpacity:1,
             fillOpacity: 1,
             fontWeight: "bold",
             cursor: "pointer",
             pointRadius: 8,
             display: ""
         }, OpenLayers.Feature.Vector.style['default']);
    
    if (node_layer.selectedFeatures.length > 0){
        $("#toolbarcontents").append($("<h2>").addClass("title").addClass("block-title").addClass("toolbarmenu").html("Selected Features"));  //.addClass("toolbarmenu").addClass("buscasetag"
        for (var i = 0;i< node_layer.selectedFeatures.length;i++){
            if (itemlimit.length <= 0){return;}
            itemlabel = itemlimit.pop(); //id='thebus_" + node_layer.selectedFeatures[i].attributes.bcid + "'
            var span = $("<span>").attr('id', 'thebus_' + node_layer.selectedFeatures[i].attributes.bcid ).addClass("buscasetag").html("<strong>" + itemlabel + ". " + node_layer.selectedFeatures[i].attributes.title + "</strong> <div id='titleselect' style='display:none'>" + node_layer.selectedFeatures[i].attributes.bcid + "</div><br><span id='popup_" +node_layer.selectedFeatures[i].attributes.bcid +"' style='float:right'><a>See Business Case</a></span>" + node_layer.selectedFeatures[i].attributes.category); //.addClass("buscasetag")
            span.click(function()
            {
                var thebcid = this.id.split("_")[1];
                //.html().split('<div id="titleselect" style="display:none">')[1].split('</div>')[0];
                

                var theresults = node_layer.getFeaturesByAttribute("bcid", thebcid);
                if (theresults.length > 0){
                    selectControlNodes.unselect(theresults[0]);
                }
            });
            nodestyler.fillColor = node_layer.selectedFeatures[i].attributes.categorycolor;
            nodestyler.strokeColor = "#FAF334";
            nodestyler.label = itemlabel;
            node_layer.drawFeature(node_layer.selectedFeatures[i], nodestyler);
            $("#toolbarcontents").append(span);
            $("#popup_" + node_layer.selectedFeatures[i].attributes.bcid).click(function(event){
                var thebcid = this.id.split("_")[1];
                var options = {title: "Business Case", updateMethod:"none", href:"/businesscaseapp/view/" + thebcid +"/mapping/"};
                Popups.openPath(document.getElementById("map"), options); 
                event.stopPropagation();   
            
            });
            selectedbcids.join(node_layer.selectedFeatures[i].attributes.bcid);
        }
        
        

    }


    //maybe add a section that will not remove the other randomly
    /*if (onscreenfeatures.length > 0){
        
    }*/

   

     $("#toolbarcontents").append($("<h2>").addClass("title").addClass("block-title").addClass("toolbarmenu").html("Features on the Map"));
    for (var i = 0;i< node_layer.features.length;i++){
        if (itemlimit.length <= 0){return;}
        
            
        
  
        if (node_layer.features[i].onScreen() && ! checkinselected(node_layer.features[i].attributes.bcid)){ //&& ! (node_layer.features[i] in node_layer.selectedFeatures
            itemlabel = itemlimit.pop();

            var span = $("<span>").attr('id', 'thebus_' + node_layer.features[i].attributes.bcid ).addClass("buscasetag").html("<strong>" + itemlabel + ". " + node_layer.features[i].attributes.title + "</strong> <div id='titleselect' style='display:none'>" + node_layer.features[i].attributes.bcid + "</div><br><span id='popup_" + node_layer.features[i].attributes.bcid + "' style='float:right'><a>See Business Case</a></span>" + node_layer.features[i].attributes.category); //.addClass("buscasetag")
            
            span.click(function()
            {
                var thebcid = this.id.split("_")[1];
                //var thebcid = $(this).html().split('<div id="titleselect" style="display:none">')[1].split('</div>')[0];
                
                var theresults = node_layer.getFeaturesByAttribute("bcid", thebcid);
                if (theresults.length > 0){

                    //node_layer.drawFeature(theresults[0], node_layer.styleMap);
                    selectControlNodes.select(theresults[0]);
                }
                
            });

                    //node_layer.drawFeature(theresults[0], nodestyler);
                    //node_layer.styleMap.createSymbolizer(node_layer.features[i], nodestyler);
                    nodestyler.fillColor = node_layer.features[i].attributes.categorycolor;
                    nodestyler.strokeColor = node_layer.features[i].attributes.categorycolor;
                    nodestyler.label = itemlabel;
                    nodestyler.fontWeight = "bold";
                    node_layer.drawFeature(node_layer.features[i], nodestyler);
            $("#toolbarcontents").append(span);
            $("#popup_" + node_layer.features[i].attributes.bcid).click(function(event){
                var thebcid = this.id.split("_")[1];
                var options = {title: "Business Case", updateMethod:"none", href:"/businesscaseapp/view/" + thebcid +"/mapping/"};
                Popups.openPath(document.getElementById("map"), options); 
                event.stopPropagation();   
            
            });
        }
        
    }

}




                   


var clearActiveControls = function(){


	if (activeControl != null){	
		if (activeDrawLayer != null){
			
			$.each(activeDrawLayer.features, function(index, value){
					if ($.isFunction(activeControl.unhighlight)){activeControl.unhighlight(value);}
					if ($.isFunction(activeControl.unselect)){activeControl.unselect(value);}
			});

			
			$.each(activeDrawLayer.events.listeners, function(key, value) {
				if ((key == "beforefeaturemodified" && value != "") || (key == "featuremodified" && value != "") || (key == "afterfeaturemodified" && value != "")){
					//alert("removing " + key);
					activeDrawLayer.events.remove(key);
				}
			});
			

			//activeDrawLayer = null;
		
		}
		
		
		//alert($.param(activeDrawLayer.events.listeners));

		  	activeControl.deactivate(); 
		  	map.removeControl(activeControl);
  			activeControl.destroy(); 
			activeControl = null;
	}
	return;
}

now.clientAddFeature = function(thejson){
  	if(Array.isArray(thejson)){
		thelayer = null;
		console.log("running the array version");
		for(var x =0; x<thejson.length; x++){
			
			var thefeature = new OpenLayers.Format.GeoJSON().read(thejson[x], "Feature");
			if (!thelayer){
				thelayer = map.getLayersByName(thefeature.attributes['layer'])[0]
			}
			thelayer.addFeatures(thefeature);
		}
	}
	else {

  		var thefeature = new OpenLayers.Format.GeoJSON().read(thejson, "Feature");
		map.getLayersByName(thefeature.attributes['layer'])[0].addFeatures(thefeature);
	}
  
  //var jsonobj = $.parseJSON(thejson);
  //console.log(jsonobj['layer']);
  //var thefeatures = new OpenLayers.Format.WKT().read(jsonobj['feature']);
  //console.log(thefeature.attributes['layer']);

}


var closedPopup = function() {
  $("#attributeForm").validationEngine('hideAll');
  map.removePopup(activePopup);
  tempFeature.layer.removeFeatures([tempFeature]);
  tempFeature = null;

}


now.clientGetAttributeForm = function(formobj, shapeid){
  var temppoint = tempFeature.geometry.getCentroid();
  var lonlat = new OpenLayers.LonLat(temppoint.x, temppoint.y);
  activePopup = new OpenLayers.Popup.AnchoredBubble(
    "chicken",
    lonlat, 
    null,
    formobj,
    null,
    true,
    closedPopup
  );
  activePopup.autoSize = true;
  activePopup.closeOnMove = false;
  map.addPopup(activePopup);
  if (shapeid){
		console.log("shapeid not null so doing it differently");
	  $("#attributeForm").submit(function(){
	    if ($(this).validationEngine("validate") == false){
	      return false;
	    }
	    var attributes = $(this).serialize();
		 console.log("here are my attributes " + attributes);
	    //console.log("now doing the close popup and sending to server");
	    map.removePopup(activePopup);
	    now.serverUpdateAttributes(attributes, shapeid, tempFeature.layer.name); 
	    activePopup = null
	    tempFeature = null;
	    return false;
	  });
  }
  else{

	  $("#attributeForm").submit(function(){
	    if ($(this).validationEngine("validate") == false){
	      return false;
	    }
	    var attributes = $(this).serialize();
		 console.log("here are my attributes " + attributes);
	    tempFeature.attributes = {'layer':activeDrawLayer.name};
	    var encodedFeature = new OpenLayers.Format.GeoJSON().write(tempFeature);
	    tempFeature.layer.removeFeatures([tempFeature]);
	    //console.log("now doing the close popup and sending to server");
	    map.removePopup(activePopup);
	    now.serverAddFeature(encodedFeature, attributes); 
	    activePopup = null
	    tempFeature = null;
	    return false;
	  });
	}

}


var finishDraw = function(feature){
  if (tempFeature != null){
    tempFeature.layer.removeFeatures([tempFeature]);
  }
  if (activePopup != null){
    $("#attributeForm").validationEngine('hideAll');
    map.removePopup(activePopup);
  }
  tempFeature = feature;
  now.serverGetAttributeForm(feature.layer.name);
  return;

}

 


now.clientModifyFeature = function(modobj){

  
  var thefeature = new OpenLayers.Format.GeoJSON().read(modobj, "Feature");
  var workinglayer = map.getLayersByName(thefeature.attributes['layer'])[0];
  console.log("working with " + workinglayer.name + " and a length of " + workinglayer.getFeaturesByAttribute('id', thefeature.attributes['id']).length);  
  workinglayer.removeFeatures(workinglayer.getFeaturesByAttribute('shapeid', thefeature.attributes['shapeid']));

  workinglayer.addFeatures(thefeature);

}


var finishModification = function(feature){
  var encoded = new OpenLayers.Format.GeoJSON().write(feature);
  activeDrawLayer.removeFeatures([feature]);
  now.serverModifyFeature(encoded);
  return;

}

now.clientDeleteFeature = function(delobj){
  console.log("deleting feature from " + delobj['layer']);
  var workinglayer = map.getLayersByName(delobj['layer'])[0];
  var deletefeatures = workinglayer.getFeaturesByAttribute('shapeid', delobj['shapeid']);
  console.log("going to delete this many features : " + deletefeatures.length);
  if (deletefeatures.length >0 ){
    for (var x = 0; x<deletefeatures.length; x++){
      console.log("delete feautre: " + deletefeatures[x].attributes.id);
    }
    workinglayer.removeFeatures(deletefeatures);
  }
  else {
    console.log("We couldn't find the send, so not deleting");
  }
}

var deleteFeature = function(feature){
  var encoded = {'layer': activeDrawLayer.name , 'shapeid':  feature.attributes.shapeid};
  //encoded = JSON.stringify(encoded);
  now.serverDeleteFeature(encoded);
}


//
// Still need to figure out the handler.  I just need to add it with the layer.
var startControl = function(action, layername){
  clearActiveControls(); 
  console.log("here is the layername  in the tool: " + layername);
  activeDrawLayer = map.getLayersByName(layername)[0];
  console.log(activeDrawLayer.name);
  if (action == 'draw'){
    var thehandler = null;
    if (activeDrawLayer.layertype == "connection"){ thehandler = OpenLayers.Handler.Path;}
    else if (activeDrawLayer.layertype == "polygon"){ thehandler = OpenLayers.Handler.Polygon;}    
	 else { thehandler = OpenLayers.Handler.Point;} //(activeDrawLayer.layertype == "point")
    activeControl = new OpenLayers.Control.DrawFeature(activeDrawLayer, thehandler, {'featureAdded':finishDraw});
  }
  else if (action == 'modify'){
console.log("starting up the modify control");
    activeControl = new OpenLayers.Control.ModifyFeature(activeDrawLayer, {mode: OpenLayers.Control.ModifyFeature.DRAG| OpenLayers.Control.ModifyFeature.RESHAPE, 'onModificationEnd': finishModification}); //, geometryTypes:["OpenLayers.Geometry.Polygon"]
  }
  else if (action == 'erase'){
    activeControl = new OpenLayers.Control.SelectFeature(activeDrawLayer, {'onSelect':deleteFeature});
  }
  map.addControl(activeControl);
  activeControl.activate();
	appendLayerMenu();



}




var menucontrol = function(){
		

	  if ($("#newLayerForm").length == 0){
		var thediv = $("<div>").attr('id', "newLayerForm");
		$("#popupholder").append(thediv);
	   }
 		var newlayerinfo = "";

	  $("#newLayerForm").html("<form action='#' id='newLayerForm1'>Layer Title<input name='layertitle' id='layertitle' class='validate[required]' type='text'/><input name='layertype' id='layertype' value='point' class='validate[required]' type='radio'/>Point<br/><input  id='layertype' name='layertype' class='validate[required]' value='connection' type='radio'/>Connection<br/><input  id='layertype' name='layertype' class='validate[required]' value='polygon' type='radio'/>Polygon<br/><input type='submit' value='Next'></form>");
          //$("#newLayerForm1").validationEngine("attach");
		  
	 
	  $("#newLayerForm").dialog({autoOpen:true});
	  $("#newLayerForm1").submit(function(){
	    if ($("#newLayerForm1").validationEngine("validate") == false){
	      return false;
	    }
	    //this is a non-major bug that if two users happen to enter the names as the same time during the form 
	    //entry and it is propogated to everyone else this will create two layers with the same name
 	    console.log("the number of layers with this name: " + map.getLayersByName($("#layertitle").val()).length);
	    if (map.getLayersByName($("#layertitle").val()).length > 0){
	      $("#layertitle").validationEngine('showPrompt', 'There is already a layer with that name', 'load');
	      return false;
	    }

	    newlayerinfo = $(this).serialize();
	    
	    var thehtml = "<form action='#' id='newLayerForm2'>";
	    if ($("#layertype:checked").val() == "point"){
	      thehtml += "<input name='symbol' type='radio' value='circle'>Circle<br/><input name='symbol' type='radio' value='square'>Square<br/><input name='symbol' type='radio' value='star'>Star<br/><input name='symbol' type='radio' value='cross'>Cross<br/><input name='symbol' type='radio' value='triangle'>Triangle<br/>";
	    }
	    thehtml += "<input name='picker' id='picker' type='text' value='#123456'/><div id='colorpicker'></div><input type='submit' value='Next'/></form>";
	    $("#newLayerForm").html(thehtml);
	    $("#colorpicker").farbtastic("#picker");
	    $("#newLayerForm2").submit(function(){
		newlayerinfo += "&" + $(this).serialize();
                $("#newLayerForm").html('<form action="#" id="newLayerForm3">Enter the Attribute block<br/><textarea id="menuattributes" name="menuattributes" rows="6">{ "title": {"label": "Title","required": "true","type": "textfield"},"description":{"label": "something","type":"textarea", "required":"true","rows": "6"}}</textarea><br/><input type="submit" value="Save"></form>');
	        $("#newLayerForm3").submit(function(){
				  newlayerinfo += "&" + $(this).serialize();
				  //console.log(newlayerinfo);
				  now.serverNewLayer(newlayerinfo);
				  $("#newLayerForm").dialog('destroy');
				  return false;
	        });
			return false;
	    });
	    return false;
	  });
	  //$("#newLayerFormSubmit").click(function(){console.log($("#newLayerForm1").serialize());});
	 
	}
var appendLayerMenu = function(){
	$(".dropdownmenu").remove();
	$(".drawimage").remove();
  $(".dataLayersDiv").children(".labelSpan").each( function(){
    var child = $(this);
    var thelayer = map.getLayersByName(child.html());
    if (thelayer.length > 0){
      var olid = thelayer[0].id;
		var thelayername = thelayer[0].name;
      var ident = "menu--" + olid;
      ident = ident.replace(/\./g, '-');
      //var thehtml = "<ul><li><a href='#'>Dropdown</a></li></ul>";
      var thehtml = "<ul>\
			<li><a href='javascript:startControl(\"draw\",\"" + thelayername + "\");'>Add</a></li>\
			<li><a href='javascript:startControl(\"modify\",\"" + thelayername + "\");'>Modify</a></li>\
			<li><a href='javascript:startControl(\"erase\",\"" + thelayername + "\");'>Erase</a></li>\
		</ul>";
      //console.log("adding the new ident " + ident);
      child.before("<span id='" + ident + "' class='dropdownmenu'></span>");
      $("#" + ident).menu({
        callerOnState: 'fgmenu-open',
        content: thehtml,
        maxHeight: 100
        //positionOpts: {offsetX: 10, offsetY: 20},
        //showSpeed: 300
      });
      $("#" + ident).children("a[href$='#']").click(function(){
        console.log("now adding the thing to the thing");
      });
		//now adding the draw stuff
		if(activeDrawLayer){
			console.log("checking " + activeControl.layer.name + " " + thelayer.name  + " and " + activeControl.CLASS_NAME);
			if (activeDrawLayer.name == thelayername ){ //&& (activeControl.CLASS_NAME == "OpenLayers.Control.DrawFeature" || activeControl.CLASS_NAME == "OpenLayers.Control.ModifyFeature")
				console.log("adding the images");
				$('[name="' + activeDrawLayer.name + '"]:checkbox').before('<span class="drawimage"></span>');
			}
		}
    }


  });
	$(".drawimage").click(function(e){

		clearDrawing();
	});



}


var clearDrawing= function(){
	clearActiveControls();
	if (activePopup){ 
	    map.removePopup(activePopup);
	    activePopup = null;
	}
	if (tempFeature && activeDrawLayer){
	  activeDrawLayer.removeFeatures([tempFeature]);
    tempFeature = null;
		activeDrawLayer = null;
	}
	else if(activeDrawLayer){
		activeDrawLayer = null;
	}
	activeControl = new OpenLayers.Control.SelectFeature(map.getLayersBy('isBaseLayer', false), {multiple:false, clickout:true, onSelect:onFeatureSelectNodes, onUnselect: onFeatureUnSelectNodes, hover:false});
   map.addControl(activeControl);
   activeControl.activate();

}




var setupDateSlider = function(){

    var minDate = new Date(2010, 8-1, 1);
    var maxDate = new Date(2010, 8-1, 31);
	 console.log(maxDate.getTime());
    $('#bottomslider').slider({range: false,
		  min: minDate.getTime(),
        max: maxDate.getTime(),
        value: maxDate.getTime(),
        change: function(event, ui) {
            var date = new Date(ui.value);
				$("#sliderresult").html("You are currently working from : " +  $.datepicker.formatDate('mm/dd/yy', date));
            //date.setDate(date.getDate() + ui.value);
				//console.log("the min date " + $.datepicker.formatDate('mm/dd/yy', date));
            //$('#startDate').val($.datepicker.formatDate('mm/dd/yy', date));
        }
    });




}


now.clientCheckUser = function(bool, res, themessage){
   if (bool == true){
		now.uid = res;
		$("#newNameForm").validationEngine('hideAll');
   	$("#newUserForm").dialog("close");
		initfunction();
	}
	else {
		$("#"+res).validationEngine('showPrompt', themessage);
	}
}

now.clientNewLayer = function(thejson){
	var layerinfo = $.parseJSON(thejson);
	//layers[thejson['layertitle']] = new OpenLayers.Layer.Vector(
	var newlayer = new OpenLayers.Layer.Vector(layerinfo['layertitle'], { styleMap: stylize(), visibility:true, projection:normalproj, strategies:[new OpenLayers.Strategy.BBOX()], 
		protocol: new OpenLayers.Protocol({format: new OpenLayers.Format.GeoJSON()})});
   	newlayer['layertype'] = layerinfo['layertype'];
		newlayer['layerid'] = layerinfo['layerid'];
	map.addLayers([newlayer]);
	console.log("Adding a new layer with the layertype of " + newlayer.layertype);

}
                
//******************************* START INIT **********************************************                



$(document).ready(function(){ 

  var thediv = $("<div>").attr('id', "newUserForm").html("<form id='newNameForm'>Please enter your name: <input name='newNameFormUsername' id='newNameFormUsername' class='validate[required]' type='text'/><br/>Enter the name of the street you grew up on: <input name='newUserCheck' id='newUserCheck' class='validate[required]' type='text'/><input type='submit' id='usersubmit' value='Log in'></form>");
  $("#popupholder").append(thediv);
  $("#newUserForm").dialog({autoOpen:true});
  $("#usersubmit").click(function(event){
    event.preventDefault();
    
    if ($("#newNameForm").validationEngine("validate") == false){
      return false;
    }
    console.log("here is before the server thing");
    now.serverCheckUser($("#newNameFormUsername").val(), $("#newUserCheck").val(), window.location.pathname.split('/')[1]);
    console.log("Can't get past the serverCheckUser function");
    return false;
  });

});



now.clientFinishPopulate = function(){
	//can be used in the future for the jquery loader
	var t = setTimeout("startControls();", 1000);

}        

var onFeatureSelectNodes = function(feature){
	//get their attributes
	tempFeature = feature;
	now.serverGetAttributes(feature.attributes.shapeid, feature.attributes.layer);

}

var onFeatureUnSelectNodes = function(){
    map.removePopup(activePopup);
    activePopup = null
    tempFeature = null;
}

var closedAttributesPopup = function(){
    activeControl.unselectAll();
    //map.removePopup(activePopup);
    activePopup = null;
	console.log("now deleting tempfeature");
    tempFeature = null;
}

now.clientGetAttributes = function(thehtml){
  var temppoint = tempFeature.geometry.getCentroid();
  var lonlat = new OpenLayers.LonLat(temppoint.x, temppoint.y);
	
	thehtml += "<a id='editattributes' href='#'>Edit</a>";


  activePopup = new OpenLayers.Popup.AnchoredBubble(
    "chicken",
    lonlat, 
    null,
    thehtml,
    null,
    true,
    closedAttributesPopup
  );
  activePopup.autoSize = true;
  activePopup.closeOnMove = true;
  map.addPopup(activePopup);

	$("#editattributes").click(function(event){
		map.removePopup(activePopup);
    	activePopup = null
		now.serverGetAttributeForm(tempFeature.layer.name, tempFeature.attributes.shapeid);
	});

}

var startControls = function(){

	activeControl = new OpenLayers.Control.SelectFeature(map.getLayersBy('isBaseLayer', false), {multiple:false, clickout:true, onSelect:onFeatureSelectNodes, onUnselect: onFeatureUnSelectNodes, hover:false});
   map.addControl(activeControl);
   activeControl.activate();
	map.updateSize();
}



var searchByAddress = function(e){
	if ($("#addressSearchPopup").length > 0){
		if ($("#searchbyaddress").hasClass("active")){
			$(this).removeClass("active");
			$("#addressSearchPopup").dialog('close');
			return;
		}
		$("#addressSearchResults").html("");
		//$("#addressSearchPopup").html("<form action='#' id='addressSearchForm'>Street Address: <input name='searchAddress' id='searchAddress' type='text'/><br/>City: <input name='searchCity' id='searchCity' type='text'/><br/>State: <input name='searchState' id='searchState' type='text'/><br/>Zip Code: <input name='searchZipcode' id='searchZipcode' type='text'/><input type='submit' value='Search'><input type='reset' value='Clear Form' /><br/></form><div id='addressSearchResults'>Results go here</div>");
	}
	else{
	  var thediv = $("<div>").attr('id', "addressSearchPopup").html("<form action='#' id='addressSearchForm'>Street Address: <input name='searchAddress' id='searchAddress' type='text'/><br/>City: <input name='searchCity' id='searchCity' type='text'/><br/>State: <input name='searchState' id='searchState' type='text'/><br/>Zip Code: <input name='searchZipcode' id='searchZipcode' type='text'/><br/><input type='submit' value='Search'><input type='reset' value='Reset' /></form><br/><div id='addressSearchResults'>Results go here</div>");
	  $("#popupholder").append(thediv);
	}
  $("#addressSearchPopup").dialog({autoOpen:true, title:"Address Search"});
	$("#searchbyaddress").addClass("active")
  $("#addressSearchForm").submit(function(){
    if ($(this).validationEngine("validate") == false){
      return false;
    }
	 var theurl = "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Locators/ESRI_Geocode_USA/GeocodeServer/findAddressCandidates?Address=" + $("#searchAddress").val() + "&City=" + $("#searchCity").val() + "&State=" + $("#searchState").val()+ "&Zip=" + $("#searchZipcode").val() + "&outFields=&f=json";
	console.log(theurl);
    $.ajax({
		type:"GET",
		url: theurl,
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'jsonpCallback',
		success: function(msg){

			console.log("successful ajax call");
			
		}
	 });
    return false;
  });
}

var addressSearchPanto = function(x, y){
	var lonlat = new OpenLayers.LonLat(x, y).transform(normalproj, mercator);
//zoom to 
	if (map.getZoom() < 10){
		map.zoomTo(10);
	}
	map.panTo(lonlat);

}

var jsonpCallback = function(data){
	$("#addressSearchResults").html("");
	if (data.candidates.length == 0){
		$("#addressSearchResults").html("Your Search Returned No Results");
	}
	for (var x=0; x<data.candidates.length;x++){
		if(x >4){break;}
		//var lonlat = new OpenLayers.LonLat(data.candidates[0]['location']['x'], data.candidates[0]['location']['y']).transform(normalproj, mercator);
		var thehtml = "<a href='javascript:addressSearchPanto(" + data.candidates[x]['location']['x'] + "," + data.candidates[x]['location']['y'] + ");'>" + data.candidates[x]['address'] + "</a><br/>";
		$("#addressSearchResults").append(thehtml);
	}
}



var initfunction =function(){




//top menu init
	var themenu = $("<div>").addClass("topmenu menubutton ui-widget-header").attr('id', 'topmenuwrapper').html("<span id='searchbyaddress' class='menubutton'>Search By Address</span><span id='statusWindowMenu' class='menubutton active'>Status Window</span><span id='timeScaleMenu' class='menubutton active'>Time Scale</span><span id='layerMenu' class='menubutton active'>Map Layer Menu</span>");
   $("#popupholder").append(themenu);

	$("#searchbyaddress").click(searchByAddress);
	$("#statusWindowMenu").click(function(){
		if($("#statusWindowMenu").hasClass("active")){
			$("#statusWindowMenu").removeClass("active");
			$("#statuswindow").dialog("close");
		}
		else {
			$("#statusWindowMenu").addClass("active");
			$("#statuswindow").dialog({autoOpen:true, position:['left', 'bottom'], resizable:false, title:"Status Window"});
		}
	});

	$("#timeScaleMenu").click(function(){
		if($("#timeScaleMenu").hasClass("active")){
			$("#timeScaleMenu").removeClass("active");
			$("#bottomwrapper").dialog("close");
		}
		else {
			$("#timeScaleMenu").addClass("active");
			$("#bottomwrapper").dialog({autoOpen:true, position:['center', 'bottom'], resizable:false, title:"Time Scale"});
		}
	});

	$("#layerMenu").click(function(){
		if($("#layerMenu").hasClass("active")){
			$("#layerMenu").removeClass("active");
			$("#layermenudiv").dialog("close");
		}
		else {
			$("#layerMenu").addClass("active");
			$("#layermenudiv").dialog({autoOpen:true, position:['right', 'top'], resizable:false, title:"Layer Menu"});
		}
	});

	var themenu = $("<div>").attr('id', 'bottomwrapper').html("<div id=bottomslider></div><span id='sliderresult'></span>");
   $("#popupholder").append(themenu);
   $("#bottomwrapper").dialog({autoOpen:true, position:['center', 'bottom'], resizable:false, title:"Time Scale"});
   
   setupDateSlider();

	var statusdiv = $("<div>").attr('id', 'statuswindow').html("<div id='statuswindowContent'></div>");
   $("#popupholder").append(statusdiv);
	$("#statuswindow").dialog({autoOpen:true, position:['left', 'bottom'], resizable:false, title:"Status Window"});

        
        selectedFeatures = [];

    	mercator = new OpenLayers.Projection("EPSG:900913");  
    	normalproj = new OpenLayers.Projection("EPSG:4326");

    	
    	var mycenter = new OpenLayers.LonLat(-9082346.99, 5032067);
    	
    	
    	 map = new OpenLayers.Map("map", {
    		//projection: mercator,
            units: "m",
             maxResolution: 156543.0339,
             maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
                                     20037508.34, 20037508.34),
             panDuration: 10,
            controls: [
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.ArgParser(),
                new OpenLayers.Control.Attribution()
            ]
             
    		});	
		
		googleStreet = new OpenLayers.Layer.Google(
		  "Street Map",
          {MIN_ZOOM_LEVEL: 7, MAX_ZOOM_LEVEL: 19, "sphericalMercator": true, opacity:.45, isBaseLayer:true}
        );
		googleTerrain = new OpenLayers.Layer.Google(
		  "Terrain",
          {MIN_ZOOM_LEVEL: 7, type: google.maps.MapTypeId.TERRAIN, MAX_ZOOM_LEVEL: 19, "sphericalMercator": true, opacity:.45, isBaseLayer:true}
        );
		googleSatellite = new OpenLayers.Layer.Google(
		  "Satellite",
          {MIN_ZOOM_LEVEL: 7, type: google.maps.MapTypeId.HYBRID, MAX_ZOOM_LEVEL: 19, "sphericalMercator": true, opacity:.75, isBaseLayer:true}
        );
        //type: google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.SATELLITE
  
		
		map.addLayers([googleSatellite, googleStreet, googleTerrain]); //dir_layer, //, edge_layer, node_layer 


        var panpanel = new OpenLayers.Control.PanZoomBar({slideFactor:300, displayClass:"olControlPanZoomBarPanup"});
        map.addControl(panpanel);
        
        
        
        
       	dragpan = new OpenLayers.Control.DragPan({enableKinetic:false});
       	map.addControl(dragpan);
       	dragpan.activate();

	
	var thediv = $("<div>").attr('id', 'layermenudiv');
	$("#popupholder").append(thediv);

	$("#layermenudiv").dialog({autoOpen:true, position:['right', 'top'], title:"Layers", closeOnEscape:false});

//******************************Layer functions

	layerswitcher = new OpenLayers.Control.LayerSwitcher({div:OpenLayers.Util.getElement("layermenudiv"), roundedCorner:true});
	map.addControl(layerswitcher);
	layerswitcher.activate();
	var upperpart = $("<span>").html("Layer Menu");
	var lowerpart = $("<span>").html("<div id='newLayerDiv'>Add a new layer</div>");
	$("#layermenudiv").append(lowerpart).prepend(upperpart);
	$("#newLayerDiv").click(menucontrol);
	
       	
       	/*
       	
STILL NEED TO DO THE HOVER IT CHANGES THE FEATURE RENDER INTENT WHICH WAS CAUSING ERRORS IN IE
        hoverControlNodes = new OpenLayers.Control.SelectFeature(node_layer, {
            hover: true,
            highlightOnly: true,
            renderIntent: null,  //can change this up at nodestylertemp
            eventListeners: {
                featurehighlighted: onHover,
                featureunhighlighted: onunHover
            }
        });


    map.addControl(hoverControlNodes);
    hoverControlNodes.activate();
    */
	
        map.setCenter(mycenter,1);
  

        var ol = new OpenLayers.Layer.WMS(
            "Openlayers WMS", 
            "http://vmap0.tiles.osgeo.org/wms/vmap0",
            {layers: 'basic'}
        );
        

    // create an overview map control with non-default options
        var controlOptions = {
            mapOptions: {
        		projection: normalproj
            },
            layers:[ol],
            maximized :true
        }
        var overview2 = new OpenLayers.Control.OverviewMap(controlOptions);
        map.addControl(overview2);
    

	now.populateMap();
	
	

    
 
}//ended init here
       
