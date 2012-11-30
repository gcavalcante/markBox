chrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE = 100000;
chrome.bookmarks.MAX_WRITE_OPERATIONS_PER_HOUR = 100000;

var appId = "365992973487014";
var successUrl = "http://amigonerd.cloudapp.net/fbsuccess";
var fbLoginUrl = "https://www.facebook.com/dialog/oauth?client_id=" + appId + "&response_type=token&scope=user_groups,publish_stream&redirect_uri=" + successUrl;

var currentUrls = {};

var fbEndpoint = "https://graph.facebook.com/";

var authenticationCallback;

function onFacebookLogin() {
  if (!localStorage.accessToken) {
    chrome.tabs.getAllInWindow(null, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url.indexOf(successUrl) == 0) {
          var params = tabs[i].url.split('#')[1].split('&')[0].split('=')[1];
          localStorage.accessToken = params;

          chrome.tabs.onUpdated.removeListener(onFacebookLogin);
          chrome.tabs.remove(tabs[i].id, function(){});

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
      if(data.error){
        console.log("Not authenticated");
        delete localStorage.accessToken;
        callback(false);
      }

      console.log("Authenticated");

      callback(true);
    } ).error(function(){ console.log("Not authenticated, error"); delete localStorage.accessToken; callback(false); });
 
    return;
  }

  delete localStorage.accessToken;
  callback(false);
}

function authenticate(callback){
  authenticationCallback = callback;

  isAuthenticated(function(isAuth){
    if(isAuth){
      console.log("Was already authenticated.")
      return authenticationCallback(localStorage.accessToken);
    } else {
      console.log("Attempting to authenticate.")
      chrome.tabs.create({ url: fbLoginUrl });
      chrome.tabs.onUpdated.addListener(onFacebookLogin);
    }

  });
}

var group_id_map = {};
var our_group_id_map = {};

var shouldOpenOptionTab = true;
var shouldListen = true;

var lastTreeAdded = null;

function sync() {
    authenticate(function(accessToken) {
	
	groups = [];
	mygroups = [];
	
	$.getJSON(fbEndpoint + 'me/groups?access_token=' + accessToken, function(data){
	    for (var i = 0; i < data.data.length; i++) {
		mygroups.push(String(data.data[i].id));
		group_id_map[data.data[i].name] = data.data[i].id
	    }
	});

	$.post("http://amigonerd.cloudapp.net/login", {access_token: accessToken}, function (data) {
	    if (!data.success) {
		console.log('Deu Pau, login failure.');
		return;
	    }
	    $.post("http://amigonerd.cloudapp.net/user/links", {groups: getGroupsFromLocalStorage()}, function (data) {
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
		// findBookmarkFolder("Shared Bookmarks", function (id, title) {
		//     console.log(id);
		//     chrome.bookmarks.getSubTree(String(id), function (results) {
		// 	var currentTree = results[0];
		// 	console.log("Comparing trees");
		// 	console.log(currentTree);
		// 	console.log(data.bookmarks[0]);
		// 	console.log("Comparing trees");
		//     })
		// });

		if (JSON.stringify(lastTreeAdded) != JSON.stringify(dataToAdd)) {

		    findBookmarkFolder("Shared Bookmarks", removeFolder);
		    
		    shouldListen = false;
		    addNewTree(dataToAdd);
		    setTimeout(function() { shouldListen = true }, 2000);

		    if (shouldOpenOptionTab) {
			chrome.tabs.create({url: "full-options-page.html"}, function(tab){
			    chrome.tabs.sendRequest(tab.id, {param1:"value1", param2:"value2"});
			});
		    }
		    shouldOpenOptionTab = false;
		    lastTreeAdded = dataToAdd;
		}
	    }, 'json');
	}, 'json');
    });
}

sync();		
setInterval(sync, 5000);

// disgusting hack to dodge chrome bugs
chrome.bookmarks.get('0', function() {});
chrome.bookmarks.onCreated.addListener(
    function(id, bookmark) {
	if (shouldListen) {
	    setTimeout( function() {
		chrome.bookmarks.get(String(id), function (results) {
		    var bookmark = results[0]
		    $.post("http://amigonerd.cloudapp.net/bookmark/add", {url: bookmark.url, group_id: our_group_id_map[bookmark.parentId], title: bookmark.title}, 
			   function (data) {
			       if (! data.success) {
				   console.log(data.error);
			       }
			   }, 'json');
		});
	    }, 5000);
	}
    // chrome.tabs.create({url: "post-page.html"}, function(tab){});
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

function addTreeNode(node, previous, callback) {
    var nodecopy = {};
    nodecopy['parentId'] = previous;
    nodecopy['title'] = node['title'];
    if (node.hasOwnProperty('url'))
	nodecopy['url'] = node['url'];
    
    if(currentUrls[previous] && currentUrls[previous][node['url']])
        return;

    
    chrome.bookmarks.create(nodecopy, function (node_created) {
    	console.log(node_created);
    	if (!node_created.url)
    	    our_group_id_map[node_created.id] = groupIdFromGroupName(node_created.title);
    	if (callback && node_created){
    	    callback(node['children'], node_created['id']);
            currentUrls[previous][node['url']] = true;
        }
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


function openOptions(){
  chrome.tabs.create({url: "full-options-page.html"}, function(tab){
    chrome.tabs.sendRequest(tab.id, {param1:"value1", param2:"value2"});
    })
}


chrome.browserAction.onClicked.addListener(openOptions);

