var appId = "365992973487014";
var successUrl = "http://markdrop.hp.af.cm/fbsuccess";
var fbLoginUrl = "https://www.facebook.com/dialog/oauth?client_id=" + appId + "&response_type=token&scope=email&redirect_uri=" + successUrl;


var fbEndpoint = "https://graph.facebook.com/";

var authenticationCallback;

function onFacebookLogin() {
  if (!localStorage.accessToken) {
    chrome.tabs.getAllInWindow(null, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url.indexOf(successUrl) == 0) {
          var params = tabs[i].url.split('#')[1].split('&')[0].split('=')[1];
          localStorage.accessToken = params;

          chrome.tabs.remove(tabs[i].id, function(){});
          chrome.tabs.onUpdated.removeListener(onFacebookLogin);

          authenticationCallback();
          return;
        }
      }
    });
  }
}

function isAuthenticated(callback){
  if(localStorage.accessToken){

    $.getJSON(fbEndpoint + 'me?access_token=' + localStorage.accessToken, function(data){
      if(data.error)
        callback(false);

      callback(true);
    } );

    return;
  }

  callback(false);
}

function authenticate(callback){
  authenticationCallback = callback;

  isAuthenticated(function(isAuth){

    if(isAuth)
      return authenticationCallback();
    else {
      chrome.tabs.create({ url: fbLoginUrl });
      chrome.tabs.onUpdated.addListener(onFacebookLogin);
    }

  });
}

authenticate(function(){
  console.log("Authenticated.");
  $.getJSON(fbEndpoint + 'me/groups?access_token=' + localStorage.accessToken, function(data){
    console.log(data);
  });
});
