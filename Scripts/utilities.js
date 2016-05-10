/*********************************************************/
/******************* Helping Method **********************/

function goHome()
{
	
	//NavigatePage("#pgHome");
	location.href='index.html#pgHome';
	location.reload(true);
}

function addStatusAction(id)
{
	NavigatePage('#pgAddStatus?id=' + id);
}

function isOdd(num) { return num % 2;}

function GoToSectionWithID(section)
{
	var id=($.urlParam("id"));
	//if (id == "")
	//	id='0';

	var path='#pg' + section + '?id='+ id;
	NavigatePage(path);
}

function EditProjectDetailsAction(Projectid)
{

	NavigatePage('#pgProjectOptions?id=' + Projectid);

}

function DecodeString(encoded) 
{
	var elem = document.createElement('textarea');
	elem.innerHTML = encoded;
	return(elem.value);
}

function CheckTouchIDAvailable()
{
	
	var RetVal=false;
	Model="";
	if (typeof device != 'undefined')
	{

		
			
			
		
		if (device.platform=='iOS' && parseInt(device.version.charAt(0))>=8)
		{
			Model=device.model.replace('iPhone','');
			if (Model.charAt(0)=="6")
			{
				if (parseInt(Model.slice(-1))!=1)
					RetVal=true;
			}
			else if (parseInt(Model.charAt(0))>6)
			{
				RetVal=true;
			}
			
			else
			{
				RetVal=false;
			}
		

		}
			
	}
	return (RetVal);
}


				
				
function showAboutMeMenu() 
{
	$( "#popupAboutMe" ).popup( "open" )
}

function showTimedElem(id)
{
	$("#" + id).show();
}

function NavigatePage(pageid)
{

	$.mobile.navigate(pageid, { transition : "flip"});
}
function NavigatePageNoSlide(pageid)
{

	$.mobile.navigate(pageid );
}

function ShowHelp()
{
	NavigatePage( "#pgHelp" );
}

function RefrestApp()
{
	location.href='index.html#pgHome';
	location.reload(true);
}


$.urlParam = function(name){
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href)||[,""])[1].replace(/\+/g, '%20')).replace("(FSLASH)","/").replace("(BSLASH)","\\") || "";
}

$.urlParamRedirect = function(name){
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href)||[,""])[1].replace(/\+/g, '%20')) || "";
}

function _encodeURIComponent(value)
{
	value = value.replace("/", "(FSLASH)").replace("\\", "(BSLASH)");
	return encodeURIComponent(value);
}
function _decodeURIComponent(value)
{
	value = value.replace("(FSLASH)", "/").replace("(BSLASH)", "\\");
	return decodeURIComponent(value);
}

function getLoadingImg()
{
	return '<img style="margin-top: 20px;" src="Images/loading.gif" border="0" />';
}

function getLoadingMini()
{
	return '<img src="Images/ajax-loader-min.gif" border="0" />';
}



var localstorage = {
    set: function (key, value) {
        window.localStorage.setItem( key, JSON.stringify(value) );
    },
    get: function (key) {
        try {
			if (window.localStorage.getItem(key) === null)
				return null;
			else
				return JSON.parse( window.localStorage.getItem(key) );
        } catch (e) {
            return null;
        }
    },
	clear: function(key) {
		window.localStorage.setItem( key, JSON.stringify(this.getUserInfoDefault()) );
		return this.getUserInfoDefault();
	},
	clearHistory: function(key) {
		window.localStorage.setItem( key, JSON.stringify(this.getHistoryDefault()) );
		return this.getHistoryDefault();
	},
	getUserInfoDefault: function() {
		return {"AuthenticationHeader" : "", "DisplayName" : "", "Email" : "", "Phone" : "", "UserID" : "", "Expiration" : 0 };
	},
	getHistoryDefault: function() {
		return {"History" : "", "Expiration" : 0 };
	}
};


function getMMDDYYYYDate(DateString)
{
	var SpacePos=DateString.indexOf(' ')
	if (SpacePos==-1) {SpacePos=10;}
	DateString=DateString.substring(0,SpacePos);

	var date = new Date(DateString);
	var year = date.getFullYear();
	var month = (1 + date.getMonth()).toString();
	

	month = month.length > 1 ? month : '0' + month;
	var day = date.getDate().toString();
	day = day.length > 1 ? day : '0' + day;
	
	return month + '/' + day + '/' + year;
}



function getTimestamp()
{
	var d = new Date();
	return d.getTime();
}

function getISODateString(DateString)
{
	if (DateString)
	{
		var d = new Date(DateString);
		return d.toISOString().substring(0,10);
	}
	else
	{
		return "";
	}
}

function getISOTodayDateString(DateString)
{
	if (DateString)
	{
		var d = new Date(DateString);
		return ConvertToISO(d).substring(0,10);
	}
	else
	{
		return "";
	}

}

function ConvertToISO(d){		
 function pad(n){return n<10 ? '0'+n : n}
 return (d.getFullYear()+'-'
      + pad(d.getMonth()+1)+'-'
      + pad(d.getDate())+'T'
      + pad(d.getHours())+':'
      + pad(d.getMinutes())+':'
      + pad(d.getSeconds())+'Z').substring(0,10)}
	  


function NowDate(){		
 function pad(n){return n<10 ? '0'+n : n}
 var d = new Date();
 return (d.getFullYear()+'-'
      + pad(d.getMonth()+1)+'-'
      + pad(d.getDate())+'T'
      + pad(d.getHours())+':'
      + pad(d.getMinutes())+':'
      + pad(d.getSeconds())+'Z').substring(0,10)}
	  
function Now(){		
 function pad(n){return n<10 ? '0'+n : n}
 var d = new Date();
 return d.getFullYear()+'-'
      + pad(d.getMonth()+1)+'-'
      + pad(d.getDate())+'T'
      + pad(d.getHours())+':'
      + pad(d.getMinutes())+':'
      + pad(d.getSeconds())+'Z'}
	  
	  
	  
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function SetRadioValue(name, SelectdValue) {
    $('input[name="' + name+ '"][value="' + SelectdValue + '"]').prop('checked', true);
	$('input[name="' + name+ '"][value="' + SelectdValue + '"]').checkboxradio("refresh");
}

navigator.browserDetail = (function(){
    var N= navigator.appName, ua= navigator.userAgent, tem;
    var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
    M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
    return M;
})();


function ShowHelpSection(id)
{
	$('html, body').animate({
        scrollTop: $(id).offset().top -80
    }, 1000);
}