/*
	Youtube Video Comment Translator - Script
	(c) 2021 - FreeAngel 
	youtube channel : http://www.youtube.com/channel/UC15iFd0nlfG_tEBrt6Qz1NQ
	github : https://github.com/frxangelz/ig_autolike_and_comment
*/

const _TRANSLATE_BUTTON_TIMEOUT = 10;  

reload = 0;
enabled = 0;
r_interval = 0;

first = true;

tick_count = 0;
cur_url = "test";

var config = {
	enable : 0,
	total : 0,
	max : 0,
	chance: 75,
	interval : 0
}

function get_random(lmin,lmax){
	var c = parseInt(lmin);
	c = c + Math.floor(Math.random() * lmax);
	if(c > lmax) { c = lmax; };
	return c;
}

elapsed_time = 0; //dari button di click
	
function showResult(srclang,src,target){

	var yts = document.querySelectorAll("yt-formatted-string#content-text");
	if((!yts) || (yts.length < 1)){
		console.log("41:Element Not Found");
		return;
	}
	
	for (var i=0; i<yts.length; i++){
		
		if(yts[i].textContent !== src){ continue; }
		
		// ge parent with tag
		var p = GetParentWithTag(yts[i],"ytd-expander");
		if(!p) { continue; }
		
		var found = false;
		// next sibling tag ytd-comment-action-buttons-renderer
		while(p){
			
			p = p.nextSibling;
			if(!p){ console.log("61:Element not Found");	return;	}
			
			if(!p.tagName) { continue; }
			var t = p.tagName.toLowerCase();
			if(t == "div"){
				
				// check if attr trid exists
				var trid = p.getAttribute("trid");
				if((trid) && (trid !== "")){
					
					p.textContent = target;
					p.setAttribute("trid",srclang);
					return;
				}
			}
			
			if (t == "ytd-comment-action-buttons-renderer") {
				
				var div = document.createElement("div");
				div.setAttribute("style","font-style: oblique; color: gray; font-size: 12px;");
				div.setAttribute("trid",srclang);
				div.setAttribute("class","translated");
				var txt = document.createTextNode(target);
				div.appendChild(txt);
				p.parentNode.insertBefore(div,p);
				found = true;
				return;
			}
		}
		
		if(!found){	console.log("70:Element Not Found");	return;	}
		
		break;
	}
}
	
function showResultEx(srcLang,srcText,targetText){

	var ts = document.querySelectorAll("div#contenteditable-root");
	if((!ts) || (ts.length < 1)) { 
		console.log("97:Element Not Found !");
		return; 
	}
	
	var txt = "";
	var innerHTML = ReplyToUserName+"</a> "+targetText;
	for(var i=0; i<ts.length; i++){
		
		txt = ts[i].textContent;
		if(txt.indexOf(srcText) !== -1){
			//ts[i].textContent = targetText;
			ts[i].innerHTML = innerHTML;
			return;
		}
	}
}

var LastSourceText = "";
var LastTargetText = "";
var LastButton = null;
	
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

	// jika content script di youtube
	if(cur_url.indexOf("youtube.com/") !== -1){
		if (request.action === "answer") {

			if(LastButton){
				LastButton.disabled = false;
			}
			var b = false;
			// check for result
			if(request.target == ""){ LastButton = null; showResult(request.lang, request.src,"error: please try again"); return; }
			if((LastSourceText == "") && (LastTargetText == "")){ b = true;	}
			if(!b){
				if((LastSourceText != request.src) && (LastTargetText != request.target)) { b = true; }
			}
				
			if(b){
				LastSourceText = request.src;
				LastTargetText = request.target;
				LastButton = null;
				showResult(request.lang,request.src, request.target);
			} else { LastButton = null; showResult(request.lang, request.src,"error: please try again");}
			return;
		}

		if (request.action === "answer_ex") {
			if(LastButton){
				LastButton.disabled = false;
				LastButton = null;
			}
			showResultEx(request.lang,request.src, request.target);
			return;
		}
		
		return;
	} // end of youtube content script
	
  if(cur_url.indexOf("translate.google.com") !== -1){
	  if(request.action == "translate"){
		  
		  do_translate(request.lang,request.src);
		  return;
	  }
	  
	  if(request.action == "translate_ex"){
		  
		  do_translate_ex(request.lang,request.src);
		  return;
	  }
	  
	  if(request.action == "user_lang"){
		  USER_LANG_CODE = getLangCode(request.lang);
		  return;
	  }
	  
  } // end of translate.google.com
	
});

function TranslateButtonClick(o){
		
		if(LastButton){
			console.log("Please wait for the translation that is still not finished");
			return;
		}
		
		var prev = o.previousSibling;
		var p = GetParentWithTag(o,"ytd-comment-action-buttons-renderer");
		if(!p) {
			console.log("84:element not found !");
			return;
		}

		var b = false;
		var req = "";
		
		while(!b){
			
			if(p.nodeName == "YTD-EXPANDER"){
				var cnt = p.querySelector("yt-formatted-string#content-text");
				req = cnt.textContent;
				b = true;
				break;
			}
			
			p = p.previousSibling;
			if(!p){
				console.log("element not found !");
				return;
			}
		}
		
		if(!b){
			console.log("90: element not found !");
			return;
		}
		
		//req
		chrome.runtime.sendMessage({action:"translate",src:req});
		o.disabled = true;
		LastButton = o;
		elapsed_time = 0; // reset ke awal
}

function GetParentWithTag(ob,tagName){

	var b = false;
	var lb = ob;
	var p = null;
	var t = tagName.toUpperCase();
	while (!b) {
		
		p = lb.parentElement;
		if(p){
			//console.log(p.nodeName);
			if (p.nodeName == t) {
				b = true;
				return p;
			}
		} else {
			return null;
		}
		
		lb = p;
	}
	
	return p;
}

// insert translate button di setiap komentar, jika belum ada
function InsertCommentButtons(){
	var divs = document.querySelectorAll('div#reply-button-end');
	for (var i=0; i<divs.length; i++){
		
		if(divs[i].getAttribute("btn-id") == "1") { continue; }
		divs[i].setAttribute("btn-id","1");
		
		var btn = document.createElement("button");
		btn.textContent = "translate";
		btn.onclick = function (e){
		
			TranslateButtonClick(this);
			e.preventDefault();
		}
		divs[i].parentNode.insertBefore(btn, divs[i]);
	}	
}

var ReplyToUserName = "";
var ReplyText = "";

function ReplyButtonClick(o){

	if(LastButton){
		console.log("Please wait for the translation that is still not finished");
		return;
	}

	// parent = div#footer
	var p = o;
	var b = false;
	while (!b) {
		
		p = p.parentElement;		
		if(!p) { return; }
		
		if(p.tagName != "DIV") { continue; }
		var id = p.getAttribute("id");
		if(id == "footer") {
			//console.log("Found Footer");
			b = true;
			break;
		}
	}
	
	if(!b) { 
		console.log("252: Element not Found !");
		return; 
	}

	b = false;
	// now find previous sibling
	while((p) && (!b)){
		
		p = p.previousSibling;
		if(p.tagName != "DIV") { continue; }
		var id = p.getAttribute("id");
		if (id == "creation-box") {
			
			b = true;
			break;
		}
		
	}
		
	if(!b) {
		console.log("Element Not Found !");
		return;
	}
	
	p = p.querySelector("div#contenteditable-root");
	if(!p){
		console.log("Element Not Found !");
		return;
	}
	
	// search for <a>
	if(p.getElementsByTagName("a")){
		
		var ih = p.innerHTML;
		var lst = ih.split("</a>");
		if(lst.length > 1){
			ReplyToUserName = lst[0];
			ReplyText = lst[1];
		} else {
			ReplyText = p.textContent;
			ReplyToUserName = "";
		}
	} else {
			ReplyText = p.textContent;
			ReplyToUserName = "";
	}
	
	
	var pr = GetParentWithTag(o,"ytd-comment-action-buttons-renderer");
	//if(!pr){ console.log("286: Element Not Found !") };
	var lang = "";
	if((pr) && (pr.previousSibling)){
		
		pr = pr.previousSibling;
		// get target language
		if((pr.nodeName == "div") || (pr.nodeName == "DIV")){
			
			var trid = pr.getAttribute("trid");
			if((trid) && (trid != "")){
				
				lang = trid;
			}
		}
	}
	
	// send request :)
	chrome.runtime.sendMessage({action:"translate_ex",lang:lang,src:ReplyText});
	o.disabled = true;
	LastButton = o;
	elapsed_time = 0; // reset ke awal
}

// insert button di reply box ( submit )
function InsertReplyButton(){
	var divs = document.querySelectorAll('ytd-button-renderer#submit-button');
	for (var i=0; i<divs.length; i++){
		if(divs[i].getAttribute("btn-id") == "1") { continue; }
		divs[i].setAttribute("btn-id","1");

		var btn = document.createElement("button");
		btn.textContent = "TRANSLATE";
		btn.onclick = function (e){
		
			ReplyButtonClick(this);
			e.preventDefault();
		}
		
		divs[i].parentNode.insertBefore(btn, divs[i]);
	}
}

// untuk menghapus bekas terjemahan yang terkadang masih nyantol jika youtube pindah video (ga reload soalnya)
var CTT_done = false;
function clearTranslatedText(){

		if(CTT_done) { return; }
		CTT_done = true;
		//console.log("CTT called");

		var divs = document.querySelectorAll("div.translated");
		for(var i=0; i<divs.length; i++){
			
			//console.log("cleared : "+divs[i].textContent);
			divs[i].textContent = "";
		}
}

let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    onUrlChange();
  }
}).observe(document, {subtree: true, childList: true});
 
 
function onUrlChange() {
  //alert('URL changed!', location.href);
  //clearTranslatedText();
  CTT_done = false;
}

    chrome.extension.sendMessage({}, function(response) {
    
	   var readyStateCheckInterval = setInterval(function() {
	       if (document.readyState === "complete") {

		   cur_url = window.location.href;
           tick_count= tick_count+1; 

		 if(cur_url.indexOf('youtube.com/') !== -1){

				clearTranslatedText();
				InsertCommentButtons();
				InsertReplyButton();
				
				if(LastButton){
					elapsed_time++;
					if(elapsed_time > _TRANSLATE_BUTTON_TIMEOUT){ LastButton.disabled = false; LastButton = null; elapsed_time = 0 }
				}
				return;
		   }
		   
		   if(cur_url.indexOf("translate.google.com") !== -1){
			   
			   if(!SourceTextArea) { getSourceTextArea(); } else {
				   check_translation_req();
			   }
			   
			   return;
		   }
		   

	   }
	}, 1000);
	
});

