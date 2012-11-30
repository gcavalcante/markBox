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





//Função para ordenar os grupos
function compare(a,b) {
  if (a.name.toLowerCase() < b.name.toLowerCase())
     return -1;
  if (a.name.toLowerCase() > b.name.toLowerCase() )
    return 1;
  return 0;
}




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
  var unsorted_groups = chrome.extension.getBackgroundPage().authenticate(function(accessToken){
    console.log("Authenticated.");
    $.getJSON('https://graph.facebook.com/me/groups?access_token=' + accessToken, function(data){

  var parsed = data['data'].sort(compare);
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
       $.getJSON('https://graph.facebook.com/' +  id + '?fields=members.fields(picture)&access_token=' + accessToken, function(data){
          html = '<div class=\"container\">';
          html += '<ul class="thumbnails">'
          var members = data['members']['data'];
          for (var i = 0; i < members.legth; i++){
              html += '<div class="span3">teste</div>'
          }
          html += '</ul>';
          html += '</div>'
          $("tab" + i).append(html);

         });
  }
  
  $('.toggle-button-class').toggleButtons({ width: 60, height: 20,  font: {'font-size': '8px'}});
    });
  });








}

getGroups();
setupActions();
