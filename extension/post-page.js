var current_group_id = -1;
var title = "";
var url = "";

function populateGroups(){
  var unsorted_groups = chrome.extension.getBackgroundPage().authenticate(function(accessToken){
    console.log("Authenticated.");
    $.getJSON('https://graph.facebook.com/me/groups?access_token=' + accessToken, function(data){

  var parsed = data['data'].sort(function(a,b){
    if (a.name.toLowerCase() < b.name.toLowerCase())
        return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase() )
        return 1;
      return 0;
  });

  if (!localStorage.hasOwnProperty('markBox')){
    var grouplist = [];

    /*
     *chrome.tabs.getCurrent(function(tab){
     *    current_tab_id = tab.id;
     *    chrome.tabs.create({url: "full-options-page.html"}, function(tab){});
     *    chrome.tabs.remove(current_tab_id);
     *});
     */

    return;
  }
  else{
    var grouplist = JSON.parse(localStorage['markBox']);
  }
  for (var i = 0; i < parsed.length; i++) {
      var groupname  = parsed[i]['name'];
      var id  = parsed[i]['id'];
       current_group_id = id;
      if (grouplist.indexOf(id) != -1){
        $('#groups').append('<li><a href=\"#tab' + i + 
                            '\" data-toggle=\"tab\" style=\"padding: 10px;\" class="group" id=\"' + id + '\">' + 
                            parsed[i].name + "</li>");
  
       console.log(id); 
        document.getElementById(id).addEventListener("click", function(event) {
            current_group_id = event.srcElement.id;
        });
      }
      else{
        $('#groups').append('<li><a href=\"#tab' + i + 
                            '\" data-toggle=\"tab\" style=\"padding: 10px;\" class="group" id=\"' + id + '\">' + 
                            parsed[i].name + "</li>");
  
       console.log(id); 
        document.getElementById(id).addEventListener("click", function(event) {
            current_group_id = event.srcElement.id;
        });
      }
  }
    });
  });
}

//----------

function takeBookmark() {
    chrome.tabs.get(parseInt(localStorage.last_tab), function(tab) {
        title = tab.title;
        url = tab.url;

        console.log(title);
        console.log(url);

       document.getElementById("book_title").textContent = title; 
       document.getElementById("book_url").textContent = url; 
       document.getElementById("book_url").href = url; 
    });

 /*
  *document.getElementById("bookmark_info").append(
  *    '<p>' + title + '</p>' +
  *    '<small><a href=\"' + url + '\">' + url + '</a></small>');
  */
    
}


//-----------

takeBookmark();
populateGroups();

document.getElementById("postButton").addEventListener("click", function(event) {
    //console.log(current_group_id);
    //console.log(bookmark);
    //console.log(document.getElementById("txt_message").value);



    chrome.extension.getBackgroundPage().authenticate(function(accessToken){
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(event) {
            if (xhr.readyState == 4) {
                if(xhr.status == 200) {
                    console.log("Blz no post!");
                } else {
                    console.log("Deu merda no post");
                }
            }
        };

        var group_post = "/" + current_group_id + "/feed/";
        var message = "message=\"" + document.getElementById("txt_message").value + 
                      "\n\n" + title + "\n" + url + "\"";
        
        /*
         *var message = 
         *    "link=\"" + url + "\"&" + 
         *    "caption=\"" + title + "\"&" +
         *    "description=\"" + document.getElementById("txt_message").value;
         */
        
        console.log(group_post);
        console.log(message);
        console.log(accessToken);

        xhr.open('POST', 'https://graph.facebook.com' + group_post, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'OAuth ' + accessToken);
        xhr.send(message);



        /*
         *chrome.bookmarks.create({'parentId': group_post,
         *                         'title': 
         */
    });
});

