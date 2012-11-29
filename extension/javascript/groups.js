$(document).ready(function(){
  doit()
});

function doit() {
  FB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      $('#login-button').hide();

      // the user is logged in and has authenticated your
      // app, and response.authResponse supplies
      // the user's ID, a valid access token, a signed
      // request, and the time the access token 
      // and signed request each expire
      var uid = response.authResponse.userID;
      var accessToken = response.authResponse.accessToken;

      FB.api('/'+ uid.toString() +'/groups', function(response) {
        var i = 0;
        for (var group in response['data']) {
          if (response['data'].hasOwnProperty(group)) {
            var groupname = response['data'][group]['name']
            $('#tabslist').append("<li><a href=\"#tab" + i + "\" data-toggle=\"tab\">" + groupname + "</a></li>");
            $('#tabscontent').append("<div class=\"tab-pane\" id=\"tab" + i + "\"><h3>Links do grupo " + groupname + "</h3></div>");
            i++;
          }
        } 
        $('#tabslist li').first().addClass("active");
        $('#tabscontent div').first().addClass("active");
      });
    }
  });
}
