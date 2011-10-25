$(document).ready( function(){
  nowInitialize();
  now.recieveMessage = function(name, message){
    $("#clickhere").append("<br>" + name + "has joined");
  }
  
  $("#clickhere").click(function(){
    now.distributeMessage("something");
    
  });

  now.name = "something";

});
