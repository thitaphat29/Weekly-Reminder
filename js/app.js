var startDate;
var endDate;
var total_tasks = 0;
var currentEventIndex = 0;

// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '838719474088-3qi1f0nsp788i0ao2vrdmhkj55h91u1d.apps.googleusercontent.com';
var SCOPES = ["https://www.googleapis.com/auth/calendar","https://www.googleapis.com/auth/tasks"];

/*
$(function () {
    $('#datetimepicker1').datetimepicker();
});
*/

$.urlParam = function(name){
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  return results[1] || 0;
}


/*----------------------------------------------------------------------- 
     Check if current user has authorized this application. 
------------------------------------------------------------------------*/
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
    loadCalendarApi();
  } 
}

/*----------------------------------------------------------------------- 
    Load Google Calendar client library. List upcoming events
    once client library is loaded.
------------------------------------------------------------------------*/
function loadCalendarApi() {
  gapi.client.load('calendar', 'v3', listUpcomingEvents);
}


/*----------------------------------------------------------------------- 
    Print the summary and start datetime/date of the next ten events in
    the authorized user's calendar. If no events are found an
    appropriate message is printed.
------------------------------------------------------------------------*/
function listUpcomingEvents() {

  var param = {
    'calendarId': 'primary',
    'timeMin': startDate,
    'timeMax': endDate,
    'showDeleted': false,
    'singleEvents': true,
    'orderBy': 'startTime'

  }

  var request = gapi.client.calendar.events.list(param);

  request.execute(function(resp) {
    var events = resp.items;
    console.log(events);

    //clear list
    $("#display-list li").remove();

    if(events.length == 0){
       $("#display-list").append('<li class="list"><div class="col-md-12">No Events</div></li>');

    }else{
      for(var i=0; i<events.length; i++){
        var subject;
        var startEvent;
        var endEvent;
        var eventTime;
        var location;
        var taskListName;

        currentEventIndex = i;
        subject = events[i].summary;
        startEvent = moment(events[i].start.dateTime);
        endEvent = moment(events[i].end.dateTime);
        eventTime = startEvent.format("h:mm a")+" - "+endEvent.format("h:mm a");
        location = events[i].location;
       
        taskListName = startEvent.format("YYYY-MM-DD HHmm")+"-"+endEvent.format("HHmm");
        
        $(".total-tasks").text(total_tasks);
        $("#display-list").append('<li class="list">'+
                          '<div class="col-md-1 total-tasks">'+total_tasks+'</div>'+
                          '<div class="col-md-7 event-name">'+subject+'<br>'+eventTime+'</div>'+
                          '<div class="col-md-2 event-location">'+location+'</div>'+
                          '<div class="col-md-1 editEvent"><input type="button" class="btn-edit btn btn-default" value="Edit"/></div>'+
                          '<div class="col-md-1 deleteEvent"><input type="button" class="btn-delete btn btn-default" value="Delete"/></div>'+
                          '<div class="eventid hidden">'+events[i].id+'</div>'+
                          '<div class="taskListName hidden">'+taskListName+'</div>'+
                          '</li>')
        
      }
      $("#display-list li").each(function(key, value){
          gapi.client.load('tasks','v1')
          .then(function(){
            var request = gapi.client.tasks.tasklists.list();

            request.execute(function(resp){
                var items = resp.items;

                $.each(items, function(taskkey, taskvalue){
                  if(taskvalue.title == $(value).find(".taskListName").text()){            
                      var taskRequest = gapi.client.tasks.tasks.list({
                          'tasklist': taskvalue.id
                      });

                      taskRequest.execute(function(resp){
                          var tasks = resp.items;
                          //total_tasks = tasks.length;
                          $(value).find(".total-tasks").text(tasks.length);
                      });
                  }
                });
            });
          });
      });
      
    }
   
  });
}

function loadTaskListApi(taskListName, totalTasksDiv){
  //gapi.client.load('tasks','v1',listTaskLists);
  gapi.client.load('tasks','v1')
  .then(function(){
    var request = gapi.client.tasks.tasklists.list();

    request.execute(function(resp){
        var items = resp.items;

        $.each(items, function(key, value){
          if(value.title == taskListName){            
              var taskRequest = gapi.client.tasks.tasks.list({
                  'tasklist': value.id
              });

              taskRequest.execute(function(resp){
                  var tasks = resp.items;
                  //total_tasks = tasks.length;
                  totalTasksDiv.text(tasks.length);
              });
          }
        });
    });
  });
}

function getCurentOfTheWeek(){

  //Set the first day of the week(Sunday)
  var firstDayOfWeek = moment().startOf('week');

  for(var i = 1; i<=7; i++){    
    $('.month-index'+i).text(firstDayOfWeek.format("MMM"));
    $('.day-index'+i).text(firstDayOfWeek.format("D"));
    $('.date-value'+i).text(firstDayOfWeek.format("YYYY-MM-DD"));

    //set start date, end date and color to current date
    if($('.day-index'+i).text() == moment().format("D")){

      startDate = moment().format("YYYY-MM-DDT00:00:00.000") + moment().format("ZZ");
      endDate = moment().format("YYYY-MM-DDT23:59:59.000") + moment().format("ZZ");
      
      $('.day-index'+i).css("color","#4285F4");      
    }
    var nextDay = firstDayOfWeek.add(1,'days');
  }
}

function deleteEvent(eventID){  
  var param = {
    'calendarId': 'primary',
    'eventId':eventID
  }

  var request = gapi.client.calendar.events.delete(param);

  request.execute(function(resp) {
    alert("Calendar event has been deleted.");
    loadCalendarApi();
  });
}

$(document).ready( function() {

    getCurentOfTheWeek();

    $(".btn-add-task").on("click", function(){
      window.location = "add.html";
    });

    $(".calendar-icon").on("click", function(){
        var dateString = $(this).find(".date").text();
        console.log(dateString);

        for(var i = 1; i<=7; i++){
          $('.day-index'+i).css("color","#68697e");
        }
        $(this).find(".calendar-day").css("color","#4285F4");

        startDate = dateString + "T00:00:00.000" + moment().format("ZZ");
        endDate = dateString + "T23:59:59.000" + moment().format("ZZ");
        loadCalendarApi();
    });
    
    $("#display-list").on("click",".btn-edit", function(){
        var eventID = $(this).parent().parent().find(".eventid").text();
        console.log(eventID);
        window.location = "update.html?eventID="+eventID;
    });

    $("#display-list").on("click",".btn-delete", function(){
        var eventID = $(this).parent().parent().find(".eventid").text();
        console.log(eventID);
        if(confirm("Do you want to delete this event?")){
          deleteEvent(eventID);
        }        
    });


});
