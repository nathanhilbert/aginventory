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

    
    var stylize_nodes = function(){
        
        var nodestylertemp = OpenLayers.Util.applyDefaults({
                 strokeWidth: 1.5,
                 strokeColor: "#FAF334",
                 strokeOpacity:.9,
                 fillColor: "#FAF334",
                 fillOpacity: .4,
                 cursor: "pointer",
                 pointRadius: 7,
                 display:""
             }, OpenLayers.Feature.Vector.style['temporary']);
        var nodestylerselect = OpenLayers.Util.applyDefaults({
                 strokeWidth: 1.5,
                 strokeColor: "#FAF334",
                 strokeOpacity:.9,
                 fillColor: "#FAF334",
                 fillOpacity: .4,
                 cursor: "pointer",
                 pointRadius: 7,
                 display:""
             }, OpenLayers.Feature.Vector.style['select']);
                          
        var thestyle = new OpenLayers.Style({
                 strokeWidth: 1,
                 strokeColor: "${categorycolor}",
                 fillColor: "${categorycolor}",
                 strokeOpacity:1,
                 fillOpacity: .9,
                 cursor: "pointer",
                 pointRadius: 7,
                 display:""
             });



        return new OpenLayers.StyleMap({'default':thestyle, 'select':nodestylerselect, 'temporary':nodestylertemp}); 
        
    }  



    var stylize_edges = function(){
    
            
          var nodestyler = OpenLayers.Util.applyDefaults({
                 strokeWidth: 1.5,
                 strokeColor: "${thestrokecolor}",
                 rotation : "${angle}",
                 fillOpacity: 0.7,
                 graphicName:"arrow",
                 pointRadius: 3,
                 fillColor: "${thestrokecolor}",
                 strokeOpacity:1,
                 display: ""
             }, OpenLayers.Feature.Vector.style['default']);
        var nodestylertemp = OpenLayers.Util.applyDefaults({
                 strokeWidth: 1.5,
                 strokeColor: "${thestrokecolor}",
                 rotation : "${angle}",
                 fillOpacity: 0.7,
                 graphicName:"arrow",
                 pointRadius: 3,
                 fillColor: "${thestrokecolor}",
                 strokeOpacity:1,
                 display: ""
             }, OpenLayers.Feature.Vector.style['temporary']);
        var nodestylerselect = OpenLayers.Util.applyDefaults({
                 strokeWidth: 1.5,
                 strokeColor: "${thestrokecolor}",
                 rotation : "${angle}",
                 fillOpacity: 0.7,
                 graphicName:"arrow",
                 pointRadius: 3,
                 fillColor: "${thestrokecolor}",
                 strokeOpacity:1,
                 display: ""
             }, OpenLayers.Feature.Vector.style['select']);
                          
        var thestyle = new OpenLayers.Style({
                 strokeWidth: 1.5,
                 strokeColor: "${thestrokecolor}",
                 rotation : "${angle}",
                 fillOpacity: 0.7,
                 graphicName:"arrow",
                 pointRadius: 3,
                 fillColor: "${thestrokecolor}",
                 strokeOpacity:1,
                 display: ""
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
console.log("here is the feature that was recieved : " + thejson);
  var thefeature = new OpenLayers.Format.GeoJSON().read(thejson, "Feature");
  
  //var jsonobj = $.parseJSON(thejson);
  //console.log(jsonobj['layer']);
  //var thefeatures = new OpenLayers.Format.WKT().read(jsonobj['feature']);
  console.log(thefeature.attributes['layer']);
  map.getLayer(thefeature.attributes['layer']).addFeatures(thefeature);
  return;


}


var closedPopup = function() {
  $("#attributeForm").validationEngine('hideAll');
  map.removePopup(activePopup);
  tempFeature.layer.removeFeatures([tempFeature]);
  tempFeature = null;
  return;

}


now.clientGetAttributeForm = function(formobj){
  console.log(formobj);
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
  console.log("now opening the popup");
  activePopup.autoSize = true;
  activePopup.closeOnMove = false;
  map.addPopup(activePopup);
  
  $("#attributeForm").submit(function(){
    if ($(this).validationEngine("validate") == false){
      return false;
    }
    var attributes = $(this).serialize();
    tempFeature.attributes = {"id":now.maxfeatureid, 'layer':activeDrawLayer.id};
    var encodedFeature = new OpenLayers.Format.GeoJSON().write(tempFeature);
    tempFeature.layer.removeFeatures([tempFeature]);
    console.log("now doing the close popup and sending to server");
    map.removePopup(activePopup);
    now.serverAddFeature(encodedFeature, attributes); 
    activePopup = null
    tempFeature = null;
    return false;
  });

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
  console.log("Now getting the attribute form from server");
  now.serverGetAttributeForm();
  return;

}

now.clientModifyFeature = function(thejson){
  console.log("here is the feature that was recieved : " + thejson);
  
  var thefeature = new OpenLayers.Format.GeoJSON().read(thejson, "Feature");
  var workinglayer = map.getLayer(thefeature.attributes['layer']);
  console.log("working with " + workinglayer.id + " and a length of " + workinglayer.getFeaturesByAttribute('id', thefeature.attributes['id']).length);  
  workinglayer.removeFeatures(workinglayer.getFeaturesByAttribute('id', thefeature.attributes['id']));

  //var jsonobj = $.parseJSON(thejson);
  //console.log(jsonobj['layer']);
  //var thefeatures = new OpenLayers.Format.WKT().read(jsonobj['feature']);
  console.log(thefeature.attributes['layer']);
  workinglayer.addFeatures(thefeature);
  return;

}


var finishModification = function(feature){
  var encoded = new OpenLayers.Format.GeoJSON().write(feature);
  activeDrawLayer.removeFeatures([feature]);
  now.serverModifyFeature(encoded);
  return;

}

now.clientDeleteFeature = function(thejson){
  var jsonobj = $.parseJSON(thejson);
  console.log("deleting feature from " + jsonobj['layer']);
  var workinglayer = map.getLayer(jsonobj['layer']);
  var deletefeatures = workinglayer.getFeaturesByAttribute('id', jsonobj['featureid']);
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
  return;
}

var deleteFeature = function(feature){
  var encoded = {'layer': activeDrawLayer.id , 'featureid':  feature.attributes.id};
  encoded = JSON.stringify(encoded);
  now.serverDeleteFeature(encoded);
  console.log("now deleting the feature");
}


//
// Still need to figure out the handler.  I just need to add it with the layer.
var startControl = function(action, layerid){
  clearActiveControls(); 
  console.log("here is the layerid in the modify tool: " + layerid);
  activeDrawLayer = map.getLayer(layerid);
  console.log(activeDrawLayer.geometryType);
  if (action == 'draw'){
    var thehandler = null;
    if (handlerArray[activeDrawLayer.name] == "Point"){ thehandler = OpenLayers.Handler.Point;}
    else if (handlerArray[activeDrawLayer.name] == "LineString"){ thehandler = OpenLayers.Handler.LineString;}
    else if (handlerArray[activeDrawLayer.name] == "Polygon"){ thehandler = OpenLayers.Handler.Polygon;}    
    activeControl = new OpenLayers.Control.DrawFeature(activeDrawLayer, thehandler, {'featureAdded':finishDraw});
  }
  else if (action == 'modify'){
console.log("starting up the modify control");
    activeControl = new OpenLayers.Control.ModifyFeature(activeDrawLayer, {mode: OpenLayers.Control.ModifyFeature.DRAG| OpenLayers.Control.ModifyFeature.RESHAPE, 'onModificationEnd': finishModification}); //, geometryTypes:["OpenLayers.Geometry.Polygon"]
  }
  else if (action == 'erase'){
    activeControl = new OpenLayers.Control.SelectFeature(activeDrawLayer, {'onSelect':deleteFeature});
  }
  else {
    //need to add a default select features
    return;
  }
  map.addControl(activeControl);
  activeControl.activate();


}




var menucontrol = function(){
	  if ($("#newLayerForm").length == 0){
		var thediv = $("<div>").attr('id', "newLayerForm");
		$("#popupholder").append(thediv);
	   }

	  $("#newLayerForm").html("<form action='#' id='newLayerForm1'>Layer Title<input name='layertitle' id='layertitle' class='validate[required]' type='text'/><input name='layertype' id='layertype' value='point' class='validate[required]' type='radio'/>Picture of point<input  id='layertype' name='layertype' class='validate[required]' value='connection' type='radio'/>Picture of connection<input  id='layertype' name='layertype' class='validate[required]' value='polygon' type='radio'/>Picture of polygon<br/><input type='submit' value='Next'></form>");
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
	      $("#layertitle").validationEngine('showPromit', 'There is already a layer with that name', 'load');
	      return false;
	    }

	    now.newlayerinfo = $(this).serialize();
	    
	    var thehtml = "<form action='#' id='newLayerForm2'>";
	    if ($("#type").val() == "point"){
	      thehtml += "<input name='symbol' type='radio' value='star'>Star<input name='symbol' type='radio' value='plus'>Plus<input name='symbol' type='radio' value='square'>Square";
	    }
	    thehtml += "<input name='picker' id='picker' type='text' value='#123456'/><div id='colorpicker'></div><input type='submit' value='Next'/></form>";
	    $("#newLayerForm").html(thehtml);
	    $("#colorpicker").farbtastic("#picker");
	    $("#newLayerForm2").submit(function(){
		now.newlayerinfo += "&" + $(this).serialize();
                $("#newLayerForm").html("<form action='#' id='newLayerForm3'>Enter the Attribute block<br/><textarea id='menuattributes' rows='6'>\
	{ 'title': \
	  {\
	    'label': 'Title',\
	    'required': true,\
	    'type': 'textfield'\
	  },\
	  'description':\
	  {\
	    'label': '',\
	    'required':true\
	    'rows': 6\
	  }\
	}</textarea><br/><input type='submit' value='Save'></form>");
	        $("#newLayerForm3").submit(function(){
		  now.newlayerinfo += "&" + $(this).serialize();
		  now.serverNewLayer();
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
  $(".dataLayersDiv").children(".labelSpan").each( function(){
    var child = $(this);
    var thelayer = map.getLayersByName(child.html());
    console.log(child.html() + " numer of layers found " + thelayer.length);
    if (thelayer.length > 0){
      var olid = thelayer[0].id;
      var ident = "menu--" + olid;
      ident = ident.replace(/\./g, '-');
      //var thehtml = "<ul><li><a href='#'>Dropdown</a></li></ul>";
      var thehtml = "<ul>\
			<li><a href='javascript:startControl(\"draw\",\"" + olid + "\");'>Add</a></li>\
			<li><a href='javascript:startControl(\"modify\",\"" + olid + "\");'>Modify</a></li>\
			<li><a href='javascript:startControl(\"erase\",\"" + olid + "\");'>Erase</a></li>\
		</ul>";
      //console.log("adding the new ident " + ident);
      child.before("<span id='" + ident + "' class='dropdownmenu'></span>");
      $("#" + ident).menu({
        callerOnState: 'fgmenu-open',
        content: thehtml,
        maxHeight: 100
        //positionOpts: {offsetX: 10, offsetY: 20},
        //showSpeed: 300
      })
      $("#" + ident).children("a[href$='#']").click(function(){
        console.log("now adding the thing to the thing");
      });
    }


  });



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

                
//******************************* START INIT **********************************************                
                

$(document).ready(function(){ 


  var thediv = $("<div>").attr('id', "newUserForm").html("<form action='#' id='newNameForm'>Please enter your name: <input name='newNameFormUsername' id='newNameFormUsername' type='text'/><input type='submit' value='Join'></form>");
  $("#popupholder").append(thediv);
  $("#newUserForm").dialog({autoOpen:true});
  $("#newNameForm").submit(function(){
    now.username = $("#newNameFormUsername").val();
    console.log("added username " + now.username);
    $("#newUserForm").dialog("close");
    return false;
  });




  now.clientNewLayer = function(thejson){
    var layerinfo = $.parseJSON(thejson);
    //layers[thejson['layertitle']] = new OpenLayers.Layer.Vector(
    var newlayer = new OpenLayers.Layer.Vector(layerinfo['layertitle'], { visibility:true, projection:normalproj, strategies:[new OpenLayers.Strategy.BBOX()], protocol: new OpenLayers.Protocol.HTTP({url:"/ajax",params: {"service":"nodes", "selectedFeatures":""},format: new OpenLayers.Format.GeoJSON()})});
    map.addLayers([newlayer]);

  }


//top menu init
	var themenu = $("<div>").addClass("topmenu ui-widget-header").attr('id', 'topmenuwrapper').html("something");
   $("#popupholder").append(themenu);

	var themenu = $("<div>").attr('id', 'bottomwrapper').html("<div id=bottomslider></div><span id='sliderresult'></span>");
   $("#popupholder").append(themenu);
   $("#bottomwrapper").dialog({autoOpen:true, position:['center', 'bottom'], resizable:false, title:"something"});
   
   setupDateSlider();

        
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
		
		googlelayer = new OpenLayers.Layer.Google(
		  "Good Physical",
          {MIN_ZOOM_LEVEL: 7, MAX_ZOOM_LEVEL: 12, "sphericalMercator": true, opacity:.45}
        );
        //type: google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.SATELLITE
        
        
        
        OpenLayers.Renderer.symbol.arrow = [0,2, 1,0, 0,2, 2,2, 1,0, 0,2];

        var draw_layer = new OpenLayers.Layer.Vector("Draw Layer", {projection:normalproj});
        handlerArray["Draw Layer"] = "Point";
        var poly_layer = new OpenLayers.Layer.Vector("Poly Layer", {projection:normalproj}); //, geometryType: OpenLayers.Geometry.Polygon
        handlerArray["Poly Layer"] = "Polygon";
        //node_layer = new OpenLayers.Layer.Vector("node_layer", { styleMap:stylize_nodes(),visibility:true, projection:normalproj, strategies:[new OpenLayers.Strategy.BBOX()], protocol: new OpenLayers.Protocol.HTTP({url:"/ajax",params: {"service":"nodes", "selectedFeatures":""},format: new OpenLayers.Format.GeoJSON()})});

        //edge_layer = new OpenLayers.Layer.Vector("edge_layer", {styleMap:stylize_edges(), visibility:true, projection:normalproj, strategies:[new OpenLayers.Strategy.BBOX()], protocol: new OpenLayers.Protocol.HTTP({url:"/businessclustermap/ajax",params: {"service":"edges", "selectedFeatures":""},format: new OpenLayers.Format.GeoJSON()})});
			



                
        
		
		map.addLayers([googlelayer, draw_layer, poly_layer]); //dir_layer, //, edge_layer, node_layer 


        var panpanel = new OpenLayers.Control.PanZoomBar({slideFactor:300, displayClass:"olControlPanZoomBarPanup"});
        map.addControl(panpanel);
        
        
        
        
       	dragpan = new OpenLayers.Control.DragPan({enableKinetic:false});
       	map.addControl(dragpan);
       	dragpan.activate();

/*
        activeControl = new OpenLayers.Control.DrawFeature(draw_layer, OpenLayers.Handler.Point, {'featureAdded': finishDraw});
        activeDrawLayer = draw_layer;
	map.addControl(activeControl);
	activeControl.activate();
*/
	
	var thediv = $("<div>").attr('id', 'layermenudiv');
	$("#popupholder").append(thediv);

	$("#layermenudiv").dialog({autoOpen:true});

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
		
		
		//selectControlNodes = new OpenLayers.Control.SelectFeature(node_layer, {multiple:false, clickout:true, onSelect:onFeatureSelectNodes, onUnselect: onFeatureUnSelectNodes, hover:false, toggleKey:"ctrlKey", multipleKey:"shiftKey"});
        //map.addControl(selectControlNodes);
        //selectControlNodes.activate();
        
        

        
      /*  
        dirStyleMap = new OpenLayers.StyleMap({'default':stylizeDirection()});
        
    	dir_layer = new OpenLayers.Layer.Vector("direction", {styleMap: dirStyleMap});


             




        
   
        
        

        



         
        map.addLayers([googlelayer, edge_layer, dir_layer,node_layer ]);
        //googlelayer.setOpacity(.35);
        
                

        

       
        

    

        
        
    
    
      var sglclick =  new OpenLayers.Control.Click({
                        handlerOptions: {
                            "single": true,
                            "stopSingle": true,
                            "pixelTolerance": 0
                        }
                    });
      map.addControl(sglclick);
      sglclick.activate();
      
            */
     //var featureclick = new OpenLayers.Handler.Feature(this, node_layer,{dblclick:mydblclick, 'click': onFeatureSelectNodes}, {'double': true, single: true,stopDouble: true, stopSingle: true} );
     //var featureclick = new OpenLayers.Handler.Feature(this, node_layer,{'click': onFeatureSelectNodes}, {'double': false, single: true,stopDouble: true, stopSingle: true} );

        //featureclick.activate();
        
        
    

    

    
        

        //map.events.register("moveend", map, moveEnd);
  
        //googlelayer.setMapObjectCenter(mycenter, 9);
        map.setCenter(mycenter,9);
        /*
        for(var x=0;x<mycases.length; x++){
            var longlat = new OpenLayers.LonLat(mycases[x][0], mycases[x][1]);
            var point = new OpenLayers.Geometry.Point(longlat.lon, longlat.lat);
            point.transform(normalproj, map.getProjectionObject());
            mycases_layer.addFeatures(new OpenLayers.Feature.Vector(point, {'bcid': mycases[x][2]}));
        }
        */

            
        

     

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
    
        
        $("#fullscreen").click(function(event){gofullscreen();});
        
        
        //setup the left toolbar
        ismin = false;
        
        $("#toolbarmin").click(function(event){minimizeToolbar();});
        
        //do delay on the screen move or zoom in make sure to cancel the delay if it does not apply
        /*
        window.setTimeout(function() {
            alert("Hello World!");
        }, 500);
        */

        
        //feature.onScreen() return bool
  //      map.events.register("moveend", map, checktimer);
        
        var loadonce = true;

	
	
	//now = nowInitialize();
	now.recieveMessage = function(){
		console.log("recievemessage was called");
	}


	//$(foo).dialog({autoOpen:true});
	now.createPopup = function(popupmessage){
	  var foo = $("<span>").html(popupmessage);
	  $(foo).dialog({autoOpen:true});
	}
	

//I think this only happens once as long as it isnt destroyed and reloaded
/*
        node_layer.events.register("loadend", node_layer, function(){
            if (loadonce){
                if (Drupal.settings.businessclustermap.mapid){
                    var resultsarray = node_layer.getFeaturesByAttribute('bcid', Drupal.settings.businessclustermap.mapid);
                    if (resultsarray.length > 0 ){
                        var thelonlat = new OpenLayers.LonLat(resultsarray[0].geometry.x,resultsarray[0].geometry.x).transform(normalproj,mercator);
                        selectControlNodes.clickFeature(resultsarray[0]);
                        map.setCenter(thelonlat,9);
                    
                    }
                
                }
                loadonce = false;
            }

            updatetoolbar();
        });
*/        

        

    
    
 
});//ended init here
       
