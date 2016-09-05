var CLIENT_ID = '838719474088-3qi1f0nsp788i0ao2vrdmhkj55h91u1d.apps.googleusercontent.com';
var SCOPES = ["https://www.googleapis.com/auth/calendar","https://www.googleapis.com/auth/tasks"];

/*----------------------------------------------------------------------- 
    Handle response from authorization server.
    @param {Object} authResult Authorization result. 
------------------------------------------------------------------------*/
function handleAuthResult(authResult) {
	if (authResult && !authResult.error) {
	  window.location="home.html";
	} 
}

function handleAuthClick(event){
	gapi.auth.authorize({client_id: CLIENT_ID, scope: SCOPES, immediate: false}, handleAuthResult);
	return false;
}

/* Check if current user has authorized this application. */
function checkAuth() {
    gapi.auth.authorize(
    {
	    'client_id': CLIENT_ID,
	    'scope': SCOPES.join(' '),
	    'immediate': true
    }, handleAuthResult);
}

