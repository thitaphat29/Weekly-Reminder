var eventID = "";
var map;
var service;
var currentLocationLatitude;
var currentLocationLongitude;
// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '838719474088-3qi1f0nsp788i0ao2vrdmhkj55h91u1d.apps.googleusercontent.com';
var SCOPES = ["https://www.googleapis.com/auth/calendar","https://www.googleapis.com/auth/tasks"];
var API_KEY = 'AIzaSyCuskLyWa4eVg4SHxT60jGdGJHTS_uDa2o';

$.urlParam = function(name){
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  return results[1] || 0;
}

function checkAuth() {
  gapi.auth.authorize(
    {
      'client_id': CLIENT_ID,
      'scope': SCOPES.join(' '),
      'immediate': true
    }, handleAuthResult);
}

/*----------------------------------------------------------------------- 
    Handle response from authorization server.
    @param {Object} authResult Authorization result. 
------------------------------------------------------------------------*/
function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    loadGoogleApi();
    
  } 
}

function loadGoogleApi(){
  	gapi.client.load('calendar', 'v3', null);
    gapi.client.load('tasks', 'v1', null);
}

function listTasks(taskID){
  var request = gapi.client.tasks.tasks.list({
      'tasklist': taskID
  });

  request.execute(function(resp){
      var tasks = resp.items;
      $("#to-do-list li").remove();

      $.each(tasks, function(key, value){
        if(value.title!=""){
          //$("#to-do-list").append('<li><input type="checkbox" ><input type="text" class="list-item" value="'+value.title+'"/><input type="button" class="task-delete btn btn-default" value="Delete"/></li>');
          $("#to-do-list").append('<li><input type="checkbox"><input type="text" class="list-item" value="'+value.title+'" /><div class="task-delete" value="Delete"><i class="fa fa-times" aria-hidden="true" ></i></div></li>');
        }
      });
     
  });
}

function displayLocations(results, status){
  console.log(results);
  $("#place-list li").remove();

  $.each(results, function(key, value){
    $("#place-list").append('<li class="place-list">'+
                    '<div class="col-md-12"><p class="place-name">'+value.name+ '</p>'+
                    '<p class="place-address">'+value.formatted_address+'</p></div></li>'+
                    '<div hidden>'+value.place_id+'</div></li>');
  });
}

function initMap() {}

function saveCalendarEvent(){
  var eventName = $("#subject").val();
  var startEvent = moment($("#txtStartDateTime").data('date'));
  var endEvent = moment($("#txtEndDateTime").data('date'));
  var taskListName = startEvent.format("YYYY-MM-DD HHmm")+"-"+endEvent.format("HHmm");  
  var placeName = $("#place").val();

  var param = {
    'calendarId': 'primary',
    'eventId':eventID,
    'summary':eventName,
    'location':placeName,
    'start':{
      'dateTime':startEvent.format()      
    },
    'end':{
      'dateTime':endEvent.format()
    }
  }

  var request = gapi.client.calendar.events.insert(param);

  request.execute(function(resp) {    
    saveTaskList(taskListName);
  });

}

function saveTaskList(taskListName){
  var param = {
    'title':taskListName
  }

  var request = gapi.client.tasks.tasklists.insert(param);

  request.execute(function(resp){
    var taskListID = resp.id;
    var taskCount = $("#to-do-list li").length;
    var iCount = 0;
    $("#to-do-list li").each(function(){
      var taskName = $(this).find('.list-item').val();
      if(taskName!=""){
        var taskRequest = gapi.client.tasks.tasks.insert({
          'tasklist':taskListID,
          'title':taskName
        });

        taskRequest.execute(function(resp){
          iCount++;
          if(iCount==taskCount){
            window.location = "home.html";
          }
          console.log(resp);
        });
      }
    });
  });
}

$(document).ready(function(){
  $('#txtStartDateTime').datetimepicker();
  $('#txtEndDateTime').datetimepicker();

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
      currentLocationLatitude = position.coords.latitude;
      currentLocationLongitude = position.coords.longitude;
    });
  }


  $("#btnLocationSearch").click(function(e){

      if($("#place").val()!=""){
          map = new google.maps.Map(document.getElementById('map'), {
              center: {lat: currentLocationLatitude, lng: currentLocationLongitude},
              zoom: 15
          });

          var request = {
            location: map.getCenter(),
            radius: '20',
            query: $("#place").val(),
            type: ['store','food','convenience_store','clothing_store','shopping_mall','home_goods_store']
          };

          var service = new google.maps.places.PlacesService(map);
          service.textSearch(request, displayLocations);

      }else{
          alert("Please enter place name.");
          $("#place").focus();
      }
      e.preventDefault();
  });

  $("#place-list").on("click",".place-list", function(){
      var placeName = $(this).find(".place-name").text();
      $("#place").val(placeName);
      $("#place-list li").remove();
  });

  $("#btnSave").click(function(){
      saveCalendarEvent();
  });

  $("#btnBack").click(function(){
    window.location = "home.html";
  });

  $("#btnAddTask").on("click",function(){
      $("#to-do-list").append('<li><input type="checkbox"><input type="text" class="list-item" /><div class="task-delete" value="Delete"><i class="fa fa-times" aria-hidden="true" ></i></div></li>');
  });

  $("#to-do-list").on("click",".task-delete", function(){
      if(confirm("Confirm to delte this task?")){
        $(this).parent().remove();
      }   
  });

  $("#btnAddTask").click();

});
