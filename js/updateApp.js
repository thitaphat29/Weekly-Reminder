var eventID = "";
var map;
var service;
var currentLocationLatitude;
var currentLocationLongitude;
var taskListID="";
var origTaskListName="";
var newTaskListName="";
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
  	eventID = $.urlParam('eventID');
    loadCalendarApi();
  } 
}

function loadCalendarApi(){
  	gapi.client.load('calendar', 'v3', listUpcomingEvents);
}

function loadTaskListApi(taskListName){
  //gapi.client.load('tasks','v1',listTaskLists);
  gapi.client.load('tasks','v1')
  .then(function(){
    var request = gapi.client.tasks.tasklists.list();

    request.execute(function(resp){
        var items = resp.items;
        console.log(items);
        $.each(items, function(key, value){
          if(value.title == taskListName){
            taskListID = value.id;
            listTasks(value.id);
          }
        });
    });
  });
}

function listTasks(taskID){
  var request = gapi.client.tasks.tasks.list({
      'tasklist': taskID
  });

  request.execute(function(resp){
      console.log(resp);
      var tasks = resp.items;
      $("#to-do-list li").remove();

      $.each(tasks, function(key, value){
        if(value.title!=""){
          $("#to-do-list").append('<li><input type="checkbox"><input type="text" class="list-item" value="'+value.title+'"/><input type="button" class="task-delete btn btn-default" value="Delete"/><div class="task-id" hidden>'+value.id+'</li>');
        }
      });
     
  });
}

function listUpcomingEvents() {

  var param = {
    'calendarId': 'primary',
    'eventId':eventID
  }

  var request = gapi.client.calendar.events.get(param);

  request.execute(function(resp) {
    console.log(resp);
    if(resp!=null){
      var startEvent = moment(resp.start.dateTime);
      var endEvent = moment(resp.end.dateTime);
      origTaskListName = startEvent.format("YYYY-MM-DD HHmm")+"-"+endEvent.format("HHmm");
      $("#subject").val(resp.summary);
      $("#txtStartDateTime").val(startEvent.format("MM/DD/YYYY hh:mm A"));
      $("#txtStartDateTime").data("DateTimePicker").defaultDate(startEvent);
      $("#txtEndDateTime").val(endEvent.format("MM/DD/YYYY hh:mm A"));
      $("#txtEndDateTime").data("DateTimePicker").defaultDate(endEvent);
      $("#place").val(resp.location);
      console.log(origTaskListName);
      loadTaskListApi(origTaskListName);
    }
   });
}

function displayLocations(results, status){
  console.log(results);
  $("#place-list li").remove();

  $.each(results, function(key, value){
    $("#place-list").append('<li class="list"><div class="place-name">'+value.name+'</div><div class="place-address">'+value.formatted_address+'</div><div hidden>'+value.place_id+'</div></li>');
  });
}

function initMap() {}

function saveCalendarEvent(){
  var eventName = $("#subject").val();
  var startEvent = moment($("#txtStartDateTime").data('date'));
  var endEvent = moment($("#txtEndDateTime").data('date'));
  newTaskListName = startEvent.format("YYYY-MM-DD HHmm")+"-"+endEvent.format("HHmm");  
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

  var request = gapi.client.calendar.events.update(param);

  request.execute(function(resp) {
    console.log(resp);
    saveTaskList(newTaskListName);
  });

}


function saveTaskList(taskListName){

  if(taskListID==""){
    var param = {
      'title':taskListName
    }

    var request = gapi.client.tasks.tasklists.insert(param);

    request.execute(function(resp){
      taskListID = resp.id;
      $("#to-do-list li").each(function(){
        var taskName = $(this).find('.list-item').val();
        if(taskName!=""){
          var taskRequest = gapi.client.tasks.tasks.insert({
            'tasklist':taskListID,
            'title':taskName
          });

          taskRequest.execute(function(resp){
            console.log(resp);
          });
        }
      });
    });
  }else{
    if(taskListName!=origTaskListName){
      var param = {
      'tasklist':taskListID,
      'title':taskListName
      }

      var taskListRequest = gapi.client.tasks.tasklists.update(param);
      taskListRequest.execute(function(resp){
        console.log(resp);
      });
    }

    $("#to-do-list li").each(function(){
      var taskName = $(this).find('.list-item').val();
      var taskID = $(this).find('.task-id').text();
      if(taskID!=""){
        var taskUpdateRequest = gapi.client.tasks.tasks.update({
            'tasklist':taskListID,
            'task':taskID,
            'title':taskName
        });
        taskUpdateRequest.execute(function(resp){
          console.log(resp);
        });
      }else{
        if(taskName!=""){
          var taskRequest = gapi.client.tasks.tasks.insert({
            'tasklist':taskListID,
            'title':taskName
          });

          taskRequest.execute(function(resp){
            console.log(resp);
          });
        }
      }
      
    });
  }
}

function deleteTask(taskID,listobj){
  if(taskID!=""){
    var taskRequest = gapi.client.tasks.tasks.delete({
      'tasklist':taskListID,
      'task':taskID
    });

    taskRequest.execute(function(resp){
      console.log(resp);
      listobj.remove();
    });
  }else{
    listobj.remove();
  }
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

  $("#place-list").on("click",".list", function(){
      var placeName = $(this).find(".place-name").text();
      $("#place").val(placeName);
  });

  $("#btnSave").click(function(){
    saveCalendarEvent();
  });

  $("#to-do-list").on("click",".task-delete", function(){
      if(confirm("Confirm to delte this task?")){
        var taskID = $(this).parent().find(".task-id").text();
        deleteTask(taskID, $(this).parent());
      }   
  });

  $("#btnAddTask").click(function(){
      $("#to-do-list").append('<li><input type="checkbox"><input type="text" class="list-item" /><input type="button" class="task-delete btn btn-default" value="Delete"/></li>');
  });

});
