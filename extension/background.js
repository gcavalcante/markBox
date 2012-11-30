chrome.tabs.create({url: "full-options-page.html"}, function(tab){
    chrome.tabs.sendRequest(tab.id, {param1:"value1", param2:"value2"});
});

