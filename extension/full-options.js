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
function getGroups(){
console.log(chrome.extension.getBackgroundPage().groupsIsReady);

console.log(chrome.extension.getBackgroundPage().groups);
var parsed = chrome.extension.getBackgroundPage().groups;
for (var i = 0; i < parsed.length; i++) {
    var groupname  = parsed[i]['name'];
    var id  = parsed[i]['id'];
    $('#tabslist').append('<li><a href=\"#tab' + i + '\" data-toggle=\"tab\" style=\"padding: 10px;\">' + 
                          parsed[i].name + 
                          '<div class=\"toggle-button-class pull-right\" style=\"margin-left: 10px;\"><input type=\"checkbox\" checked=\"checked\"  id=\"check' +
                          id +  '\"></div>' + '</li>');
    $('#tabscontent').append("<div class=\"tab-pane\" id=\"tab" + i + "\"><h3>Links do grupo " + groupname + "</h3></div>");
    
}

$('.toggle-button-class').toggleButtons({ width: 60, height: 20,  font: {'font-size': '8px'}});
      //return parsed;
}

getGroups();
