var config = {
	enable : 0,
	total : 0,
	max : 100,
	interval : 5,
	chance: 10				// max interval ( sebelumnya chance probability )
}

var target_lang_code = "";
var user_lang ="English";	// default bahasa inggris, untuk komentar, bukan reply
var last_lang_code="en";	// dari komentar
var text_to_translate = "";
var translate_req_mode = 0;		// komentar, kalau 1 request untuk reply

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
				
	// dari yt ke background untuk permintaan translate komentar (bukan post)			
    if (request.action == "translate"){
		// kirim balik ke semua tab
		send_translate_req(request.lang,request.src);
		translate_req_mode = 0;
		return;
	}
	
	if (request.action == "translate_ex"){
		send_translate_ex_req(request.lang,request.src);
		translate_req_mode = 1;
		return;
	}
	
	// request target code lang untuk diimplement di translate.google.com
	if (request.action == "target_lang_code"){
			target_lang_code = request.code;
			text_to_translate = request.txt;
			sendResponse({action:"OK"});
			return;
	}
	
	// jika translate.google.com meminta targe code lang yang sedang di request
	if (request.action == "get_target_lang_code"){
		sendResponse({code:target_lang_code, txt:text_to_translate, mode: translate_req_mode, userlang: user_lang, last:last_lang_code});
		return;
	}
	
	if(request.action == "set_user_lang"){
		user_lang = request.lang;
		send_user_lang(user_lang);
		return;
	}
	
	if(request.action == "setlastlangcode"){
		last_lang_code = request.code;
		return;
	}
	
	// dari translate.google.com jika sudah berhasil translated
	if(request.action == "answer"){
	
		var message = {action: "answer",lang:request.lang,src:request.src,target:request.target};
		//console.log(message);
		if((request.code) && (request.code != "")){ last_lang_code = request.code;}
		// kirim ke semua tab
		send_answer(request.lang,request.src,request.target);
		return;
	}
	
	// dari translate.google.com jika sudah berhasil translated
	if(request.action == "answer_ex"){
	
		var message = {action: "answer_ex",lang:request.lang,src:request.src,target:request.target};
		// kirim ke semua tab
		send_answer_ex(request.lang,request.src,request.target);
		return;
	}
	
 });
 
 function send_translate_req(srcLang,srcText){
 
		chrome.tabs.query({}, function(tabs) {
		var message = {action: "translate", lang: srcLang, src: srcText};
		for (var i=0; i<tabs.length; ++i) {
			chrome.tabs.sendMessage(tabs[i].id, message);
		}
	}); 
 }
 
 function send_translate_ex_req(srcLang,srcText){
 
		chrome.tabs.query({}, function(tabs) {
		var message = {action: "translate_ex", lang: srcLang, src: srcText};
		for (var i=0; i<tabs.length; ++i) {
			chrome.tabs.sendMessage(tabs[i].id, message);
		}
	}); 
 }
 
 function send_answer(srclang,srcText,srcTarget){
 
		chrome.tabs.query({}, function(tabs) {
		var message = {action: "answer", lang:srclang, src: srcText, target: srcTarget};
		for (var i=0; i<tabs.length; ++i) {
			chrome.tabs.sendMessage(tabs[i].id, message);
		}
	}); 
 }
 
 function send_answer_ex(srclang,srcText,srcTarget){
 
		chrome.tabs.query({}, function(tabs) {
		var message = {action: "answer_ex", lang:srclang, src: srcText, target: srcTarget};
		for (var i=0; i<tabs.length; ++i) {
			chrome.tabs.sendMessage(tabs[i].id, message);
		}
	}); 
 }
 
 function send_user_lang(userLang){
		chrome.tabs.query({}, function(tabs) {
		var message = {action: "user_lang", lang:userLang};
		for (var i=0; i<tabs.length; ++i) {
			chrome.tabs.sendMessage(tabs[i].id, message);
		}
	}); 
 }
 
 	chrome.storage.sync.get('lang', function(data) {
		if((data.lang) && (data.lang != "")){
			user_lang = data.lang;
			console.log("From config : "+user_lang);
		}
	});