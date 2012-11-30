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

          authenticationCallback(localStorage.accessToken);
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
      return authenticationCallback(localStorage.accessToken);
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

chrome.tabs.create({url: "full-options-page.html"}, function(tab){
    chrome.tabs.sendRequest(tab.id, {param1:"value1", param2:"value2"});
});

// var input = {'bookmarks': 
//              [
//                {'title': 'Shared Bookmarks',
// 		'children': [],
// 		'index': 0 
//                }
//              ]
//             };


// var topFolderID = -1;
// var groups = [];
// var groupsIsReady = false;
// var mygroups = [];
// var group_id_map = {};

function sync() {
    authenticate(function() {
	
	groups = [];
	mygroups = [];
	
	groupsIsReady = true;
	findBookmarkFolder("Shared Bookmarks", removeFolder);
	$.post("http://markdrop.hp.af.cm/login", {access_token: facebook.getAccessToken()}, function (data) {
	    if (!data.success) {
		console.log('Deu Pau, login failure.');
		return;
	    }
	    console.log(facebook.getAccessToken());
	    console.log(mygroups);
	    $.post("http://markdrop.hp.af.cm/user/links", {groups: getGroupsFromLocalStorage()}, function (data) {
		if (!data.success) {
		    console.log('Deu Pau, login failure.');
		    return;
		}
		var dataToAdd = {'bookmarks': 
				 [
				     {'title': 'Shared Bookmarks',
				      'children': data.bookmarks,
				      'index': 0 
				     }
				 ]
				};
		console.log(dataToAdd);
		addNewTree(dataToAdd);
	    }, 'json');
	}, 'json');
    });
}

		


    // //setInterval(sync, 5000);

//Search the bookmarks when entering the search keyword.
$(function() {
  $('#search').change(function() {
     $('#bookmarks').empty();
     dumpBookmarks($('#search').val());
  });
});

chrome.bookmarks.get('0', function() {});

chrome.bookmarks.onCreated.addListener(
    function(id, bookmark) {
	console.log(bookmark);
	$.post("http://markdrop.hp.af.cm/bookmark/add", {url: bookmark.url, group_id: groupIdFromGroupName(bookmark.name), title: bookmark.title}, 
	       function (data) {
		   if (! data.success) {
		       console.log(data.error);
		   }
	       }, 'json');
    }
);
chrome.bookmarks.onRemoved.addListener(
    function(id, bookmark) {
	console.log(bookmark);
    }
);
chrome.bookmarks.onChanged.addListener(
    function(id, bookmark) {
	console.log(bookmark);
    }
);
chrome.bookmarks.get('0', function() {});

function groupIdFromGroupName(name) {
    return group_id_map[name];
}

function getSharedBookmarks() {
  var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
    });
}

function getGroupsFromLocalStorage() {
    return mygroups;
}

function findBookmarkFolder(query, callback) {
    var bookmarkTreeNodes = chrome.bookmarks.getTree(function(bookmarkNodes) {
	var i;
	console.log(query);
	for (i = 0; i < bookmarkNodes.length; i++) {
	    findBookmarkFolderHelper(bookmarkNodes[i], query, callback);
	}
    });
}

function findBookmarkFolderHelper(node, query, callback) {
    if (node.children) {
	for (var i = 0; i < node.children.length; i++) {
	    findBookmarkFolderHelper(node.children[i], query, callback);
	}
    }
    if (String(node.title).indexOf(query) != -1) {    
	callback(node.id, node.title);
    }   
}

function set_folder_id(id, title) {
    topFolderID = id;
}

function removeFolder(id, title) {
    chrome.bookmarks.removeTree(String(id));    
}

// Traverse the bookmark tree, and print the folder and nodes.
function dumpBookmarks(query) {
  var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
    });
}
function dumpTreeNodes(bookmarkNodes, query) {
  var list = $('<ul>');
  var i;
  for (i = 0; i < bookmarkNodes.length; i++) {
    list.append(dumpNode(bookmarkNodes[i], query));
  }
  return list;
}
function dumpNode(bookmarkNode, query) {
  if (bookmarkNode.title) {
    if (query && !bookmarkNode.children) {
      if (String(bookmarkNode.title).indexOf(query) == -1) {
        return $('<span></span>');
      }
    }
    var anchor = $('<a>');
    anchor.attr('href', bookmarkNode.url);
    anchor.text(bookmarkNode.title);
    /*
     * When clicking on a bookmark in the extension, a new tab is fired with
     * the bookmark url.
     */
    anchor.click(function() {
      chrome.tabs.create({url: bookmarkNode.url});
    });
    var span = $('<span>');
    var options = bookmarkNode.children ?
      $('<span>[<a href="#" id="addlink">Add</a>]</span>') :
      $('<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" ' +
        'href="#">Delete</a>]</span>');
    var edit = bookmarkNode.children ? $('<table><tr><td>Name</td><td>' +
      '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
      '</td></tr></table>') : $('<input>');
    // Show add and edit links when hover over.
        span.hover(function() {
        span.append(options);
        $('#deletelink').click(function() {
          $('#deletedialog').empty().dialog({
                 autoOpen: false,
                 title: 'Confirm Deletion',
                 resizable: false,
                 height: 140,
                 modal: true,
                 overlay: {
                   backgroundColor: '#000',
                   opacity: 0.5
                 },
                 buttons: {
                   'Yes, Delete It!': function() {
                      chrome.bookmarks.remove(String(bookmarkNode.id));
                      span.parent().remove();
                      $(this).dialog('destroy');
                    },
                    Cancel: function() {
                      $(this).dialog('destroy');
                    }
                 }
               }).dialog('open');
         });
        $('#addlink').click(function() {
          $('#adddialog').empty().append(edit).dialog({autoOpen: false,
            closeOnEscape: true, title: 'Add New Bookmark', modal: true,
            buttons: {
            'Add' : function() {
               chrome.bookmarks.create({parentId: bookmarkNode.id,
                 title: $('#title').val(), url: $('#url').val()});
               $('#bookmarks').empty();
               $(this).dialog('destroy');
               window.dumpBookmarks();
             },
            'Cancel': function() {
               $(this).dialog('destroy');
            }
          }}).dialog('open');
        });
        $('#editlink').click(function() {
         edit.val(anchor.text());
         $('#editdialog').empty().append(edit).dialog({autoOpen: false,
           closeOnEscape: true, title: 'Edit Title', modal: true,
           show: 'slide', buttons: {
              'Save': function() {
                 chrome.bookmarks.update(String(bookmarkNode.id), {
                   title: edit.val()
                 });
                 anchor.text(edit.val());
                 options.show();
                 $(this).dialog('destroy');
              },
             'Cancel': function() {
                 $(this).dialog('destroy');
             }
         }}).dialog('open');
        });
        options.fadeIn();
      },
      // unhover
      function() {
        options.remove();
      }).append(anchor);
  }
  var li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    li.append(dumpTreeNodes(bookmarkNode.children, query));
  }
  return li;
}

function addTreeNode(node, previous, callback) {
  var nodecopy = {};
  nodecopy['parentId'] = previous;
  nodecopy['title'] = node['title'];
  if (node.hasOwnProperty('url'))
    nodecopy['url'] = node['url'];

  chrome.bookmarks.create(nodecopy, function (node_created) {
    console.log(node_created);
    if (callback)
      callback(node['children'], node_created['id']);
  });
}

function addTreeNodes(bookmarkArray, previous) {
  var i;
  for (i = 0; i < bookmarkArray.length; i++) {
    if (bookmarkArray[i].hasOwnProperty('children') && bookmarkArray[i]['children'].length > 0) {
      addTreeNode(bookmarkArray[i], previous, addTreeNodes); // cria o diretorio
    }
    else
      addTreeNode(bookmarkArray[i], previous, null); //só cria o link
  }
}

function addNewTree(treejson) {
  var bookmarkArray = treejson['bookmarks'];
  addTreeNodes(bookmarkArray, '1');
}

// // document.addEventListener('DOMContentLoaded', function () {
// //   chrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE = 1000;
// //   addNewTree(input);
// //   dumpBookmarks();
// // });
