var sl = document.getElementsByTagName('select')[0];
	chrome.storage.sync.get('lang', function(data) {
	if((data.lang) && (data.lang != "")){
		sl.value = data.lang;
	}
});

sl.onchange = function() {
  var index = this.selectedIndex;
  var inputText = this.children[index].innerHTML.trim();
 
  //document.getElementById("test").textContent = inputText;
  chrome.storage.sync.set({ lang: inputText });
  chrome.runtime.sendMessage({action:"set_user_lang",lang:inputText});
}
