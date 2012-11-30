document.addEventListener("load", function(event) {
    chrome.tabs.create({url: "post-page.html"}, function(tab){});
});
