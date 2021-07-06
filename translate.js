/* translate.google.com ------------------------------------------------------------------------------------*/
var SourceTextArea = null;
const _TRANSLATE_TIME_OUT = 2000; // translate timeout

/*
const langs = ["Afrikaans","Albanian","Amharic","Arabic","Armenian","Azerbaijani","Basque","Belarusian","Bengali","Bosnian","Bulgarian","Catalan","Cebuano","Chichewa","Chinese (Simplified)","Chinese (Traditional)",
"Corsican","Croatian","Czech","Danish","Dutch","check","English","Esperanto","Estonian","Filipino","Finnish","French","Frisian","Galician","Georgian","German","Greek","Gujarati","Haitian Creole","Hausa","Hawaiian",
"Hebrew","Hindi","Hmong","Hungarian","Icelandic","Igbo","Indonesian","Irish","Italian","Japanese","Javanese","Kannada","Kazakh","Khmer","Kinyarwanda","Korean","Kurdish (Kurmanji)","Kyrgyz","Lao","Latin","Latvian",
"Lithuanian","Luxembourgish","Macedonian","Malagasy","Malay","Malayalam","Maltese","Maori","Marathi","Mongolian","Myanmar (Burmese)","Nepali","Norwegian","Odia (Oriya)","Pashto","Persian","Polish","Portuguese","Punjabi",
"Romanian","Russian","Samoan","Scots Gaelic","Serbian","Sesotho","Shona","Sindhi","Sinhala","Slovak","Slovenian","Somali","Spanish","Sundanese","Swahili","Swedish","Tajik","Tamil","Tatar","Telugu","Thai","Turkish","Turkmen",
"Ukrainian","Urdu","Uyghur","Uzbek","Vietnamese","Welsh","Xhosa","Yiddish","Yoruba","Zulu"];
*/

function getDetectedLanguage(){
	
	var divs = document.querySelectorAll('div.ooArgc');
	if(!divs) { return ""; }
	
	for(var i=0; i<divs.length; i++){
		
		var att = divs[i].getAttribute("tabindex");
		if(att == 0){
			var tc = divs[i].textContent.split(" - ");
			return tc[0];
		}
	}
	
	return "";
}

function getLangCode(lang){
	var divs = document.querySelectorAll("div.PxXj2d");

	for(var i=0; i<divs.length; i++){

		if(divs[i].textContent == lang) { 
			var langCode = divs[i].parentNode.getAttribute("data-language-code");
			return langCode;
		}
	}
	
	return "";
}

function getLangFromCode(code){
	var divs = document.querySelectorAll("div.PxXj2d");

	for(var i=0; i<divs.length; i++){

		var langCode = divs[i].parentNode.getAttribute("data-language-code");
		if(langCode == code){
			return divs[i].textContent;
		}
	}
	
	return "";
}

function selectSourceLang(lang){
	
	var divs = document.querySelectorAll("div.PxXj2d");

	for(var i=0; i<divs.length; i++){

		if(divs[i].textContent == lang) { 
			divs[i].click(); break; 
		}
	}
}

function selectAutoDetect(){
	
	var divs = document.querySelectorAll('button.LxQvde');
	for(var i=0; i<divs.length; i++){
		var tc = divs[i].textContent.toUpperCase();
		console.log(tc);
		if(tc.indexOf("DETECT") !== -1){
			divs[i].click();
			break;
		}
	}
}

function getSourceTextArea(){

	var ta = document.querySelectorAll("textarea");
	
	for(var i=0; i<ta.length; i++){
		var al = ta[i].getAttribute("aria-label");
		if(al=="Source text") {
			SourceTextArea = ta[i];
			break;
		}
	}	
}

function getTranslationResult(){
	
	var spans = document.querySelectorAll("span.ChMk0b");
	var result = "";
	var attr = null;
	
	for (var i=0; i<spans.length; i++){
		attr= spans[i].getAttribute("data-language-for-alternatives");
		if((!attr) || (attr == "")) { continue; }
		
		result = result + spans[i].children[0].textContent;
	}	
	
	return result;
}

function setNativeValue(element, value) {
      const { set: valueSetter } = Object.getOwnPropertyDescriptor(element, 'value') || {}
      const prototype = Object.getPrototypeOf(element)
      const { set: prototypeValueSetter } = Object.getOwnPropertyDescriptor(prototype, 'value') || {}

      if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value)
      } else if (valueSetter) {
        valueSetter.call(element, value)
      } else {
        //throw new Error('The given element does not have a value setter')
		return false;
      }
	  
	  return true;
}

// fill textarea -> o (textarea object)
function setComment(o,text){

  o.scrollIntoView();
  if (!setNativeValue(o, text)) { return false; }
  o.dispatchEvent(new Event('input', { bubbles: true }))
  return true;
}

function send_answer(srcLang,srcText,targetText){

		var msg = {action:"answer",lang:srcLang,src:srcText,target:targetText};
		chrome.runtime.sendMessage(msg);
}

function send_answer_ex(srcLang,srcText,targetText){

		var msg = {action:"answer_ex",lang:srcLang,src:srcText,target:targetText};
		chrome.runtime.sendMessage(msg);
}

USER_LANG_CODE = "";
function do_translate(lang,src){

		if(USER_LANG_CODE == "") { return; }
		
		if(window.location.href.indexOf("tl="+USER_LANG_CODE) === -1){
			chrome.runtime.sendMessage({action:"target_lang_code",code:USER_LANG_CODE,txt:src},function(response){
				if(response.action=="OK"){
					window.location.href = "https://translate.google.com/?sl=auto&tl="+USER_LANG_CODE;
					return;
				}
			});
			
			return;
		}
		
		if((lang == "") || (!lang) || (lang=="undefined")) { selectAutoDetect(); }
		else { selectSourceLang(lang); }
		
		if(!SourceTextArea){ send_answer(lang,src,"135:translation error"); return;	}
		
		setComment(SourceTextArea, src);
		setTimeout(function(){
			var target = getTranslationResult();
			var srcLang = getDetectedLanguage();
			var langCode = getLangCode(srcLang);
			LAST_LANG_CODE = langCode;
			chrome.runtime.sendMessage({action:"setlastlangcode",code:langCode});

			if(target != ""){ send_answer(srcLang,src,target); }
		},_TRANSLATE_TIME_OUT);
}

CURRENT_LANG_CODE = "";
LAST_LANG_CODE = "en";

function do_translate_ex(lang,srcText){

		var langCode =  LAST_LANG_CODE;
		if(lang != "") { langCode =	getLangCode(lang); }
		if(langCode == ""){	return;	}
		
		if(CURRENT_LANG_CODE != langCode){
			
			chrome.runtime.sendMessage({action:"target_lang_code",code:langCode,txt:srcText},function(response){
				if(response.action=="OK"){
					window.location.href = "https://translate.google.com/?sl=auto&tl="+langCode;
					return;
				}
			});
			
			return;
		}
		
		if(window.location.href.indexOf("sl=auto") === -1){	selectAutoDetect(); }
		if(!SourceTextArea){ send_answer_ex(lang,src,"155:translation error"); return;	}
		
		// check for username
		var src = srcText.trim();
		var username = "";
		var teks = "";
		if(src.charAt(0) == "@"){
			
			var lst = src.split(" ");
			username = lst[0];
			teks = src.replace(username,"");
			
		} else {
			teks = src;
		}
		
		setComment(SourceTextArea, teks);
		setTimeout(function(){
			var target = username+getTranslationResult();
			var srcLang = getDetectedLanguage();
			if(target != ""){ send_answer_ex(srcLang,srcText,target); }
			// kosongkan target lang di background
			chrome.runtime.sendMessage({action:"target_lang_code",code:langCode,txt:""});
		},_TRANSLATE_TIME_OUT);
}

var check_translation_req_done = false;

function check_translation_req(){

	if(check_translation_req_done) { return; }
	check_translation_req_done = true;
	chrome.runtime.sendMessage({action:"get_target_lang_code"}, function(response){
		
		USER_LANG_CODE = getLangCode(response.userlang);
		CURRENT_LANG_CODE = response.code;
		LAST_LANG_CODE = response.last;
		
		if(window.location.href.indexOf("&tl="+CURRENT_LANG_CODE) === -1){ console.log("No Lang Req"); return; }
		if(response.txt == "") { console.log("No Translation Req Text"); return; }
		
		if(window.location.href.indexOf("sl=auto") === -1){	selectAutoDetect(); }

		// check for username
		if(!response.txt){ console.log("No Response Txt"); return; }
		var src = response.txt.trim();
		var username = "";
		var teks = "";
		if(src.charAt(0) == "@"){
			
			var lst = src.split(" ");
			username = lst[0];
			teks = src.replace(username,"");
			
		} else {
			teks = src;
		}
		
		setComment(SourceTextArea,teks);
		setTimeout(function(){
			var target = username+getTranslationResult();
			var srcLang = getDetectedLanguage();
			if(response.mode == 1){	send_answer_ex(srcLang,response.txt,target); }
			else {
				var srcLangCode = getLangCode(srcLang);
				LAST_LANG_CODE = srcLangCode;
				send_answer(srcLang,response.txt,target);
			}
			// kosongkan target lang di background
			chrome.runtime.sendMessage({action:"target_lang_code",code:response.code,txt:""});
		},_TRANSLATE_TIME_OUT);
	});
}