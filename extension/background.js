chrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE = 100000;
chrome.bookmarks.MAX_WRITE_OPERATIONS_PER_HOUR = 100000;

var appId = "365992973487014";
var successUrl = "http://amigonerd.cloudapp.net/fbsuccess";
var fbLoginUrl = "https://www.facebook.com/dialog/oauth?client_id=" + appId + "&response_type=token&scope=user_groups&redirect_uri=" + successUrl;


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

var group_id_map = {};
var our_group_id_map = {};

var shouldOpenOptionTab = true;
var shouldListen = true;

function sync() {
    authenticate(function(accessToken) {
	
	groups = [];
	mygroups = [];
	
	$.getJSON(fbEndpoint + 'me/groups?access_token=' + localStorage.accessToken, function(data){
	    for (var i = 0; i < data.data.length; i++) {
		mygroups.push(String(data.data[i].id));
		group_id_map[data.data[i].name] = data.data[i].id
	    }
	});

	findBookmarkFolder("Shared Bookmarks", removeFolder);
	$.post("http://amigonerd.cloudapp.net/login", {access_token: accessToken}, function (data) {
	    if (!data.success) {
		console.log('Deu Pau, login failure.');
		return;
	    }
	    console.log(accessToken);
	    console.log(mygroups);
	    $.post("http://amigonerd.cloudapp.net/user/links", {groups: getGroupsFromLocalStorage()}, function (data) {
//	    $.post("http://markdrop.hp.af.cm/user/links", {groups: ["169585166498448", "241233442662434", "359297677495908"]}, function (data) {
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

		shouldListen = false;
		addNewTree(dataToAdd);
		setTimeout(function() { shouldListen = true }, 2000);

		if (shouldOpenOptionTab) {
		    chrome.tabs.create({url: "full-options-page.html"}, function(tab){
			chrome.tabs.sendRequest(tab.id, {param1:"value1", param2:"value2"});
		    });
		}
		shouldOpenOptionTab = false;
	    }, 'json');
	}, 'json');
    });
}

sync();		
//setInterval(sync, 5000);

// disgusting hack to dodge chrome bugs
chrome.bookmarks.get('0', function() {});
chrome.bookmarks.onCreated.addListener(
    function(id, bookmark) {
	if (shouldListen) {
	    console.log(bookmark);
	    setTimeout( function() {
		chrome.bookmarks.get(String(id), function (results) {
		    console.log(results[0]);
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

function addTreeNode(node, previous, callback) {
    var nodecopy = {};
    nodecopy['parentId'] = previous;
    nodecopy['title'] = node['title'];
    if (node.hasOwnProperty('url'))
	nodecopy['url'] = node['url'];
    
    
    chrome.bookmarks.create(nodecopy, function (node_created) {
	console.log(node_created);
	if (!node_created.url)
	    our_group_id_map[node_created.id] = groupIdFromGroupName(node_created.title);
	if (callback && node_created)
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
