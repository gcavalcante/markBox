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

//Funções para salvar as preferências
//
//

function doSomething(event) {
  var checkeds = $(".checkbox");
  var st = [];
  for (var i=0; i < checkeds.length; i++){
      if (checkeds[i].checked){
        st.push(checkeds[i].id);
      }
  }
  localStorage['markBox'] = JSON.stringify(st);

 }

function setupActions() {
   // get the link object
   document.getElementById("saveButton").onclick = doSomething;
 }
 
function getGroups(){
  if (chrome.extension.getBackgroundPage().groupsIsReady != true){
    document.location.reload(true); 
  
  }
  var parsed = chrome.extension.getBackgroundPage().groups;
  if (!localStorage.hasOwnProperty('markBox')){
      var grouplist = [];
  }
  else{
    var grouplist = JSON.parse(localStorage['markBox']);
  }
  for (var i = 0; i < parsed.length; i++) {
      var groupname  = parsed[i]['name'];
      var id  = parsed[i]['id'];
      if (grouplist.indexOf(id) != -1){
        $('#tabslist').append('<li><a href=\"#tab' + i + '\" data-toggle=\"tab\" style=\"padding: 10px;\">' + 
                            parsed[i].name + 
                            '<div class=\"toggle-button-class pull-right\" style=\"margin-left: 10px;\"><input type=\"checkbox\" class=\"checkbox\" checked=\"checked\"  id=\"' +
                            id +  '\"></div>' + '</li>');

      }
      else{
        $('#tabslist').append('<li><a href=\"#tab' + i + '\" data-toggle=\"tab\" style=\"padding: 10px;\">' + 
                            parsed[i].name + 
                            '<div class=\"toggle-button-class pull-right\" style=\"margin-left: 10px;\"><input type=\"checkbox\" class=\"checkbox\" id=\"' +
                            id +  '\"></div>' + '</li>');

      }
      $('#tabscontent').append("<div class=\"tab-pane\" id=\"tab" + i + "\"><h3>Links do grupo " + groupname + "</h3></div>");
      
  }
  
  $('.toggle-button-class').toggleButtons({ width: 60, height: 20,  font: {'font-size': '8px'}});
        //return parsed;
}

getGroups();
setupActions();
