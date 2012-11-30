/*
 * Copyright 2011 Google Inc. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var facebook = new OAuth2('facebook', {
    client_id: '365992973487014',
    client_secret: '8a51d68b0e1337b14d0466ca235857dc',
    api_scope: 'read_stream,user_likes'
});
facebook.authorize(function() {

    //document.addEventListener('DOMContentLoaded', function() {

    // Make an XHR that creates the task
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(event) {
	if (xhr.readyState == 4) {
	    if(xhr.status == 200) {
		// Great success: parse response with JSON
		var parsed = JSON.parse(xhr.responseText);
		var html = '';
		for (var i = 0; i < parsed.data.length; i++) {
        var groupname  = parsed.data[i]['name']
        $('#tabslist').append('<li><a href=\"#tab" + i + "\" data-toggle=\"tab\">' + parsed.data[i].name + '<input type="checkbox" name=\"checkbox' + groupname + '\" value=\"' + groupname + '\"> </li>');
        //$('#tabslist').append("<li><a href=\"#tab" + i + "\" data-toggle=\"tab\">" + groupname + "</a></li>");
		    $('#tabscontent').append("<div class=\"tab-pane\" id=\"tab" + i + "\"><h3>Links do grupo " + groupname + "</h3></div>");
        
        //console.log(parsed.data[i]);
		}


		//document.querySelector('#groups').innerHTML = html;
		return;

	    } else {
		// Request failure: something bad happened
	    }
	}
    };

    xhr.open('GET', 'https://graph.facebook.com/me/groups', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'OAuth ' + facebook.getAccessToken());

    xhr.send();

});
