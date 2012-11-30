function postAtGroup(group_id, url) {
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

        var group_post = "/" + group_id + "/feed/";
        //var message = "message=\"" + url + "\"";
        var message = "link=\"" + url + "\"";
        

        xhr.open('POST', 'https://graph.facebook.com' + group_post, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'OAuth ' + accessToken);
        xhr.send(message);
    });
});

