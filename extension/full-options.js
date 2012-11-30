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
        $('#tabslist').append('<li><a href=\"#tab' + id + '\" data-toggle=\"tab\" style=\"padding: 10px;\">' + 
                            parsed[i].name + 
                            '<div class=\"toggle-button-class pull-right\" style=\"margin-left: 10px;\"><input type=\"checkbox\" class=\"checkbox\" checked=\"checked\"  id=\"' +
                            id +  '\"></div>' + '</li>');

      }
      else{
        $('#tabslist').append('<li><a href=\"#tab' + id + '\" data-toggle=\"tab\" style=\"padding: 10px;\">' + 
                            parsed[i].name + 
                            '<div class=\"toggle-button-class pull-right\" style=\"margin-left: 10px;\"><input type=\"checkbox\" class=\"checkbox\" id=\"' +
                            id +  '\"></div>' + '</li>');

      }
      $('#tabscontent').append("<div class=\"tab-pane\" id=\"tab" + id + "\"></div>");
      console.log("getting for id " + id);
       $.getJSON('https://graph.facebook.com/' +  id + '?fields=description,name,members.limit(5).fields(picture.width(211).height(151))&access_token=' + accessToken, function(data){
          var html = '<ul class="thumbnails">'
          var members = data['members']['data'];
          for (var i = 0; i < members.length && i < 5; i++){
              console.log(members[i]);
              //html += '<li class="span3">'
              //html +=   '<a href="#" class="img-polaroid">'
              html += '<img class="img-polaroid" width="150" height="111" src="'+ members[i].picture.data.url +  '" alt="">'
              //html +=  '</a>'
              //html += '</li>'

          }
          html += '</ul>';
          html += ' <div class="page-header"> <h3> ' + data.name + '</h3>';
          if (data.hasOwnProperty('description')){
            html += '<small>' + data.description + '</small>';
          }
          html += '</div>'
          $("#tab" + data.id).append(html);
          console.log("adding for tab"+ data.id);

         });
  }
  
  $('.toggle-button-class').toggleButtons({ width: 60, height: 20,  font: {'font-size': '8px'}});
    });
  });








}

getGroups();
setupActions();
