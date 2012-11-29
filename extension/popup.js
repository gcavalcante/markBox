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

var input = {'bookmarks': 
             [
               {'title': 'Shared Bookmarks',
		'children': []
               }
             ]
            };


var facebook = new OAuth2('facebook', {
    client_id: '365992973487014',
    client_secret: '8a51d68b0e1337b14d0466ca235857dc',
    api_scope: 'read_stream,user_likes'
});
facebook.authorize(function() {

    // Make an XHR that creates the task
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(event) {
	if (xhr.readyState == 4) {
	    if(xhr.status == 200) {
		// Great success: parse response with JSON
		var parsed = JSON.parse(xhr.responseText);
		var html = '';
		for (var i = 0; i < parsed.data.length; i++) {
		    html += '<li>' + parsed.data[i].name + '</li>';
		    console.log(parsed.data[i]);
		    input['bookmarks'][0]['children'].push({'childen':[], 'title': parsed.data[i].name});
		}
		console.log(input)
		document.querySelector('#music').innerHTML = html;
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


// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Search the bookmarks when entering the search keyword.
// $(function() {
//   $('#search').change(function() {
//      $('#bookmarks').empty();
//      dumpBookmarks($('#search').val());
//   });
// });
// // Traverse the bookmark tree, and print the folder and nodes.
// function dumpBookmarks(query) {
//   var bookmarkTreeNodes = chrome.bookmarks.getTree(
//     function(bookmarkTreeNodes) {
//       $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
//     });
// }
// function dumpTreeNodes(bookmarkNodes, query) {
//   var list = $('<ul>');
//   var i;
//   for (i = 0; i < bookmarkNodes.length; i++) {
//     list.append(dumpNode(bookmarkNodes[i], query));
//   }
//   return list;
// }
// function dumpNode(bookmarkNode, query) {
//   if (bookmarkNode.title) {
//     if (query && !bookmarkNode.children) {
//       if (String(bookmarkNode.title).indexOf(query) == -1) {
//         return $('<span></span>');
//       }
//     }
//     var anchor = $('<a>');
//     anchor.attr('href', bookmarkNode.url);
//     anchor.text(bookmarkNode.title);
//     /*
//      * When clicking on a bookmark in the extension, a new tab is fired with
//      * the bookmark url.
//      */
//     anchor.click(function() {
//       chrome.tabs.create({url: bookmarkNode.url});
//     });
//     var span = $('<span>');
//     var options = bookmarkNode.children ?
//       $('<span>[<a href="#" id="addlink">Add</a>]</span>') :
//       $('<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" ' +
//         'href="#">Delete</a>]</span>');
//     var edit = bookmarkNode.children ? $('<table><tr><td>Name</td><td>' +
//       '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
//       '</td></tr></table>') : $('<input>');
//     // Show add and edit links when hover over.
//         span.hover(function() {
//         span.append(options);
//         $('#deletelink').click(function() {
//           $('#deletedialog').empty().dialog({
//                  autoOpen: false,
//                  title: 'Confirm Deletion',
//                  resizable: false,
//                  height: 140,
//                  modal: true,
//                  overlay: {
//                    backgroundColor: '#000',
//                    opacity: 0.5
//                  },
//                  buttons: {
//                    'Yes, Delete It!': function() {
//                       chrome.bookmarks.remove(String(bookmarkNode.id));
//                       span.parent().remove();
//                       $(this).dialog('destroy');
//                     },
//                     Cancel: function() {
//                       $(this).dialog('destroy');
//                     }
//                  }
//                }).dialog('open');
//          });
//         $('#addlink').click(function() {
//           $('#adddialog').empty().append(edit).dialog({autoOpen: false,
//             closeOnEscape: true, title: 'Add New Bookmark', modal: true,
//             buttons: {
//             'Add' : function() {
//                chrome.bookmarks.create({parentId: bookmarkNode.id,
//                  title: $('#title').val(), url: $('#url').val()});
//                $('#bookmarks').empty();
//                $(this).dialog('destroy');
//                window.dumpBookmarks();
//              },
//             'Cancel': function() {
//                $(this).dialog('destroy');
//             }
//           }}).dialog('open');
//         });
//         $('#editlink').click(function() {
//          edit.val(anchor.text());
//          $('#editdialog').empty().append(edit).dialog({autoOpen: false,
//            closeOnEscape: true, title: 'Edit Title', modal: true,
//            show: 'slide', buttons: {
//               'Save': function() {
//                  chrome.bookmarks.update(String(bookmarkNode.id), {
//                    title: edit.val()
//                  });
//                  anchor.text(edit.val());
//                  options.show();
//                  $(this).dialog('destroy');
//               },
//              'Cancel': function() {
//                  $(this).dialog('destroy');
//              }
//          }}).dialog('open');
//         });
//         options.fadeIn();
//       },
//       // unhover
//       function() {
//         options.remove();
//       }).append(anchor);
//   }
//   var li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
//   if (bookmarkNode.children && bookmarkNode.children.length > 0) {
//     li.append(dumpTreeNodes(bookmarkNode.children, query));
//   }
//   return li;
// }

// function addTreeNode(node, previous, callback) {
//   var nodecopy = {};
//   nodecopy['parentId'] = previous;
//   nodecopy['title'] = node['title'];
//   if (node.hasOwnProperty('url'))
//     nodecopy['url'] = node['url'];

//   chrome.bookmarks.create(nodecopy, function (node_created) {
//     console.log(node_created);
//     if (callback)
//       callback(node['children'], node_created['id']);
//   });
// }

// function addTreeNodes(bookmarkArray, previous) {
//   var i;
//   for (i = 0; i < bookmarkArray.length; i++) {
//     if (bookmarkArray[i].hasOwnProperty('children') && bookmarkArray[i]['children'].length > 0) {
//       addTreeNode(bookmarkArray[i], previous, addTreeNodes); // cria o diretorio
//     }
//     else
//       addTreeNode(bookmarkArray[i], previous, null); //só cria o link
//   }
// }

// function addNewTree(treejson) {
//   var bookmarkArray = input['bookmarks'];
//   addTreeNodes(bookmarkArray, '234');
// }

// document.addEventListener('DOMContentLoaded', function () {
//   chrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE = 1000;
//   addNewTree(input);
//   dumpBookmarks();
// });
