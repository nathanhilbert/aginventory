// JavaScript Document




var googlelayer, map, normalproj, mercator, node_layer, edge_layer, myredraw, selectControlNodes, dir_layer, selectedFeatures, updatetimer, hoverControlNodes, timeOut, currentpopup, ismin;

//var now;
var layerswitcher;

var onscreenfeatures = [];










//******************************End layer class*********************************************************

//********************************Now functions ****************************************************











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
    
    


function originalscreen(){

    $('#layerSelect').removeClass('infopanelmax');
    $('#toolbarcontents').removeClass("toolbarmax"); 
    $('#map').addClass('minscreenmap');
    $('#map').removeClass('fullscreenmap');
    //$('#movemenu').unbind('drag').addClass('hide');
    $('#originalscreen').unbind('click'); 
    $('#originalscreen').addClass('hide');

    map.updateSize();

    return;
}    
    
    
function gofullscreen(){


    $('#layerSelect').addClass('infopanelmax');
    //$("#content-inner-inner").css({ 'position': 'absolute'});;
    /*
    $('#layerSelect').bind('drag',function( event ){
                $( '#layerSelect' ).css({
                        top: event.offsetY,
                        left: event.offsetX
                        });
                });
*/


    $('#map').removeClass('minscreenmap');
    $('#map').addClass('fullscreenmap');
    //.append($('#menudiv'))
   
    $('#originalscreen').click(function(event){event.stopPropagation();originalscreen();});
    $('#toolbarcontents').addClass("toolbarmax"); 

    external_panel = new OpenLayers.Control.Panel({
                    div: $('#layerSelect') });
    
    //$('#movemenu').removeClass('hide');

    //$('<div class="infopanelmax">return to original screen</div>').click(function(event){originalscreen();});
    $('#originalscreen').removeClass('hide');
    map.pan(0,0);
    map.updateSize();
    //map.addControl(external_panel);


}







//*************************Hover functions***************************************************************
   
   /*
          var output = "Building: " + id + " Area: " + area.toFixed(2);
        dialog = $("<div title='Feature Info'>" + output + "</div>").dialog();
    },
    featureunselected: function() {
        
    }
}); 
   */
   
   
   
   
   
    function makeHover(feature){
    
        
    
    /*
            feature.popup = new OpenLayers.Popup.FramedCloud("chicken", 
                                     feature.geometry.getBounds().getCenterLonLat(),
                                     null,
                                     "<div style='font-size:.8em'>Feature: " + feature.id +"<br>Area: " + feature.geometry.getArea()+"</div>",
                                     null, false, null);
            map.addPopup(feature.popup)
            */
        /*
    $('[id=temphoverdialog]').dialog("destroy").remove();
    
    var positionleft = "left";
    var positiontop = "top";
    if ($("#tempdialog").length){
         var parentpos = $("#tempdialog").parent().position();
         positiontop = parentpos.top +200;
         positionleft = parentpos.left;

    }

        
    $("<div id='temphoverdialog' title='Highlighted Business' class='infopopup'><strong>Category :</strong> " +   feature.attributes.category + "<br><strong>Business Title :</strong> " +  feature.attributes.title + "</div>").dialog({ position: [positionleft, positiontop]});
    */
        timeOut = null;
    }



    var onHover = function(evt){
        $("#thebus_" + evt.feature.attributes.bcid).addClass("busselected");
        //timeOut = setTimeout(function(){makeHover(evt.feature)}, 400);
        /*
        if ((selectedFeaturebcid) &&(selectedFeaturebcid != feature.bcid)){
            timeOut = setTimeout(function(){makeHover(feature)}, 400);
        }
        else if (!selectedFeaturebcid){
            timeOut = setTimeout(function(){makeHover(feature)}, 400);
        }
        */
        
        
    } 
    
    function onunHover(evt){
        $("#thebus_" + evt.feature.attributes.bcid).removeClass("busselected");
        /*
        if (timeOut != null){
            clearTimeout(timeOut);
            timeOut = null;
        }
        */
        /*
        if (evt.feature.popup != null){
            map.removePopup(evt.feature.popup);
            evt.feature.popup.destroy();
            evt.feature.popup = null;
        }
        */
        //$('[id=temphoverdialog]').dialog("destroy").remove();


        //document.getElementById('FeatureHighlightedCategory').innerHTML = "Nothing Highlighted";
        //document.getElementById('FeatureHighlightedTitle').innerHTML = "Nothing Highlighted";
    
    

    }
//*******************************End Hover Functions**************************************************************







//*******************************Loading Functions**************************************************************



var startLoad = function(){
	Popups.addLoading();


	return;
}

var stopLoad = function() {
    Popups.removeLoading();
	return;
}




//******************************Action Handler **********************************************************
	

	
	function mydblclick(feature) {
	var options = {title: "Business Case", updateMethod:'none', href:"/businesscaseapp/view/" + feature.attributes.bcid + "/mapping/"};
        Popups.openPath(document.getElementById('map'), options, null);    
	}   

var onFeatureUnSelectNodes = function(feature){
    onFeatureSelectNodes(feature);
    return;

}

    var onFeatureSelectNodes = function(feature){
    /*
        if (feature.popup != null){
            map.removePopup(feature.popup);
            feature.popup.destroy();
            feature.popup = null;
        }
        */
        updatetoolbar();
        var tempstring = "";
        edge_layer.removeAllFeatures();
        //alert(node_layer.selectedFeatures[0].attributes.bcid);
        for (var i =0; i< node_layer.selectedFeatures.length;i++){
            tempstring += node_layer.selectedFeatures[i].attributes.bcid + "*^";
        }

    

        edge_layer.protocol.params['selectedFeatures'] = tempstring;
        

        edge_layer.strategies[0].update({"force":true});

        
        return;

            
    }
    
    
//toolbar functions
var checktimer = function(){
    if (updatetimer != null){
        clearTimeout(updatetimer);
        updatetimer = null;
    }
    updatetimer = setTimeout(function() {
          updatetoolbar();
    }, 1000);
    return;

}    


var checkinselected = function(bcid){
    for (var i = 0;i< node_layer.selectedFeatures.length;i++){
        if (node_layer.selectedFeatures[i].attributes.bcid == bcid){
            return true;
        }
    }
    return false;

}


    
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



var maximizeToolbar = function(){
    ismin = false;
    $("#toolbarcontents").html('<span id="toolbarmin" style="float:right;"><img src="/sites/all/modules/businessclustermap/image/layer-switcher-minimize.png" style="width:18px;height:18px"></span>');
    $("#toolbarmin").click(function(){minimizeToolbar();});
    $("#toolbarcontents").addClass("toolbarmax");
    updatetoolbar();
    return;    
}


var minimizeToolbar = function(){
    ismin = true;
    $("#toolbarcontents").html('<span id="toolbarmax" style="float:right;"><img src="/sites/all/modules/businessclustermap/image/layer-switcher-maximize.png" style="width:18px;height:18px"></span><span class="toolbarmenu buscasetag">Map Menu</span>');
    $("#toolbarmax").click(function(){maximizeToolbar();});
    return;

}
                   


var finishDrawPoint = function(feature){
  console.log("featured added" + feature.geometry.x);
  now.distributeMessage("Here is the message that I sent from clientside");
  return;

}


                
//******************************* START INIT **********************************************                
                

$(document).ready(function(){ 
        
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
        node_layer = new OpenLayers.Layer.Vector("node_layer", { styleMap:stylize_nodes(),visibility:true, projection:normalproj, strategies:[new OpenLayers.Strategy.BBOX()], protocol: new OpenLayers.Protocol.HTTP({url:"/ajax",params: {"service":"nodes", "selectedFeatures":""},format: new OpenLayers.Format.GeoJSON()})});

        //edge_layer = new OpenLayers.Layer.Vector("edge_layer", {styleMap:stylize_edges(), visibility:true, projection:normalproj, strategies:[new OpenLayers.Strategy.BBOX()], protocol: new OpenLayers.Protocol.HTTP({url:"/businessclustermap/ajax",params: {"service":"edges", "selectedFeatures":""},format: new OpenLayers.Format.GeoJSON()})});
			



                
        
		
		map.addLayers([googlelayer, draw_layer, node_layer]); //dir_layer, //, edge_layer, node_layer 


        var panpanel = new OpenLayers.Control.PanZoomBar({slideFactor:300, displayClass:"olControlPanZoomBarPanup"});
        map.addControl(panpanel);
        
        
        
        
       	dragpan = new OpenLayers.Control.DragPan({enableKinetic:false});
       	map.addControl(dragpan);
       	dragpan.activate();


        var activeControl = new OpenLayers.Control.DrawFeature(draw_layer, OpenLayers.Handler.Point, {'featureAdded': finishDrawPoint});
	map.addControl(activeControl);
	activeControl.activate();
	
	var thediv = $("<div>").attr('id', 'layermenudiv');
	$("#popupholder").append(thediv);

	$("#layermenudiv").dialog({autoOpen:true});

	layerswitcher = new OpenLayers.Control.LayerSwitcher({div:OpenLayers.Util.getElement("layermenudiv"), roundedCorner:true});
	map.addControl(layerswitcher);
	layerswitcher.activate();
	var upperpart = $("<span>").html("Layer Menu");
	var lowerpart = $("<span>").html("<div id='newLayerDiv'>Add a new layer</div>");
	$("#layermenudiv").append(lowerpart).prepend(upperpart);
	$("#newLayerDiv").click(function(){
	  console.log("at least I got here");
	  var thediv = $("<div>").attr('id', "newLayerForm").html("<form action='#' id='newLayerForm1'><input name='firstname' type='text'/><input name='lastname' type='text'/><input type='submit' value='Next'></form>");
	 
	  $("#popupholder").append(thediv);
	  $("#newLayerForm1").submit(function(){
	    now.newlayerinfo = $(this).serialize();
	    $("#newLayerForm").html("<form action='#' id='newLayerForm2'><input name='thirdname' type='text'><input type='submit' value='Send'/></form>");
	    $("#newLayerForm2").submit(function(){
		now.newlayerinfo += "&" + $(this).serialize();
		now.setNewLayer();
		return false;
	    });
	    return false;
	  });
	  //$("#newLayerFormSubmit").click(function(){console.log($("#newLayerForm1").serialize());});
	  $("#newLayerForm").dialog({autoOpen:true});
	});
	
       	
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

            
        
        /*
        if (selectedFeaturebcid != 0){
            var callurl = "/businessclustermap/ajax?bcid=" + selectedFeaturebcid;
            var response = OpenLayers.Request.GET({'url': callurl, 'callback': parseNodes });         
        } else {
            moveEnd();
        }
        */
     

        var ol = new OpenLayers.Layer.WMS(
            "Openlayers WMS", 
            "http://vmap0.tiles.osgeo.org/wms/vmap0",
            {layers: 'basic'}
        );
        

        //var mapResolutions = [39135.7584820001];
        
        ///var ol = new OpenLayers.Layer.ArcGISCache("Openlayers WMS","http://ampgis.osu.edu/arcgiscache/Hotspot_analysis/Layers/_alllayers",{tileSize:  new OpenLayers.Size(512,512), tileOrigin: new OpenLayers.LonLat(-20037508.342787,20037508.342787),resolutions: mapResolutions,sphericalMercator: true,maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,20037508.34, 20037508.34),useArcGISServer: false,isBaseLayer: true,projection: mercator});
        
     

        
    // create an overview map control with non-default options
        var controlOptions = {
            mapOptions: {
        		projection: mercator
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
       
