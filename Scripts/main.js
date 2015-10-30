var serviceRootUrl = Configs.ServiceRootUrl;
//var serviceRootUrl = Configs.ServiceRootUrl;
var spwebRootUrl = Configs.SharePointRootUrl;
var ConfidenceLevel = Configs.ConfidenceLevel;

var isPageLoadReady = false;
var isSkipPageLoad = "";
var isUserLogin = false;
var isWebBrowser = false;
var userInfoData = null;
var $scope = null;
var deviceInfo = "";

var userLongitude = 0;
var userLatitude = 0;

var userSearchText = "";
var userSearchSystemType = "All";
	

	
	
	
	
	
if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/) && location.href.toLowerCase().indexOf( 'http://' ) < 0 && location.href.toLowerCase().indexOf( 'https://' ) < 0) 
{
	document.addEventListener("deviceready", onDeviceReady, false);
} else {
	isWebBrowser = true;
	$( document ).ready(function() {
		onDeviceReady(); //this is the browser
	});
	
}


function onDeviceReady() {
	$.mobile.pageLoadErrorMessage = "";

	if (typeof device != 'undefined')
		deviceInfo = device.model + '|' + device.platform + '|' + device.version;
	else
		deviceInfo = "Browser:" + navigator.browserDetail;
	
	
	try {
		navigator.geolocation.watchPosition(
			function (position) {
				userLongitude = position.coords.longitude;
				userLatitude = position.coords.latitude;
			}, 
			function (error) {
			}
		);
	}
	catch (err) {}
	
	
	localstorage.set("DeviceInfo", deviceInfo);

	checkUserLogin();	

	isPageLoadReady = true;
	
};

/////////////////////////Database Functions//////////////////////////////
/*
 function populateDB(tx) {
         tx.executeSql('DROP TABLE IF EXISTS PROJECTS');
         tx.executeSql('CREATE TABLE IF NOT EXISTS PROJECTS (id unique, data)');
         tx.executeSql('INSERT INTO PROJECTS (id, data) VALUES (1, "First row")');
         tx.executeSql('INSERT INTO PROJECTS (id, data) VALUES (2, "Second row")');
         tx.executeSql('INSERT INTO PROJECTS (id, data) VALUES (3, "Third row")');
    }

    // Transaction error callback
    //
    function errorCB(tx, err) {
        alert("Error processing SQL: "+err);
    }

    // Transaction success callback
    //
    function successCB() {
        //alert("success!");
    }

	function queryDB(tx) {
		tx.executeSql('SELECT * FROM PROJECTS', [], querySuccess, errorCB);
	}

	function querySuccess(tx, results) {
		console.log("Returned rows = " + results.rows.length);
		
		//To get first row
		var catalog = results.rows.item(0);
		
		//To Show Data
		//alert(catalog.data);
		//catalog = results.rows.item(1);  //Second row
		//alert(catalog.data);
		catalog = results.rows.item(2);  //3rd row
		alert(catalog.data);

		
		// this will be true since it was a select statement and so rowsAffected was 0
		if (!results.rowsAffected) {
			console.log('No rows affected!');
			return false;
		}
		// for an insert statement, this property will return the ID of the last inserted row
		console.log("Last inserted row ID = " + results.insertId);
	}

*/
/////////////////////////Event Handlers//////////////////////////////
  //reset type=date inputs to text
  $( document ).bind( "mobileinit", function(){
    $.mobile.page.prototype.options.degradeInputs.date = true;
  });	


$( document ).on( "pagebeforeshow", "#pgProjectOptions", function(event) {
	$("#pnlProjectActivity-ProjectOptions" ).html("");
	$("#pnlProjectDetails-ProjectOptions" ).html("");
	
			var id = $.urlParam("id");

				var _url1 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url1, true, "callbackLoadProjectOptionsSidePanelIPMActivity");

				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectHeaderById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url2, true, "callbackLoadProjectOptionsSidePanel");

	
});


$( document ).on( "pagebeforeshow", "#pgHome", function(event) {
	checkUserLogin();

	
	//Database functions
	//var db = window.openDatabase("billtrakdb", "1.0", "BillTrak DB", 20480000);
	//var db = window.sqlitePlugin.openDatabase("test", "1.0", "Test DB", 20480000);
	//var db = window.sqlitePlugin.openDatabase({name: "test"});

	//db.transaction(populateDB, errorCB, successCB);
	//db.transaction(queryDB, errorCB);
	
	var _url = serviceRootUrl + "svc.aspx?op=LogHomePage&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.Email;
	Jsonp_Call(_url, false, "");	
	
	});

	
$( document ).on( "pagebeforeshow", "#pgRoom", function(event) {

	window.localStorage.setItem("RDFrontLat", '0');
	window.localStorage.setItem("RDFrontLon", '0');

	window.localStorage.setItem("RDBackLat", '0');
	window.localStorage.setItem("RDBackLon", '0');

	window.localStorage.setItem("RDLeftLat", '0');
	window.localStorage.setItem("RDLeftLon", '0');

	window.localStorage.setItem("RDRightLat", '0');
	window.localStorage.setItem("RDRightLon", '0');

});	
	


$( document ).on( "pagebeforeshow", "#startpage", function(event) {
	checkUserLogin();

});

$( document ).on( "pagebeforeshow", "#pgHelp", function(event) {
	checkUserLogin();
	$("#td-error").text("");
});

$( document ).on( "pagebeforeshow", "#pgLogin", function(event) {
	checkUserLogin();	
	$("#td-error").text("");
	
	$('#password').keyup(function (event) {
		if (event.which == 13) {
			$("#btnLoginSubmit").click();
		}
	});
	
});

$( document ).on( "pagebeforeshow", "#pgSearch", function(event) {

	
	searchAction();
});

$('.appSearchBtnLink').on('click', '.ui-input-clear', function(e){

	performSearch();
});

$( document ).on( "pageinit", "#pgSearch", function(event) {

	$( "#searchCatalogs" ).keypress(function(e) {
		if (e.keyCode == 13) {
		
            performSearch();
        }
	});
	
	$("#userSearchSortBy").bind( "change", function(event, ui) {
	
		performSearch();
	});
});

///////////////////////////////////////////////////////



function LoginUser()
{
	if ($('#login') === undefined || $('#login').val() == '') {
		$('#td-error').html('Please provide login.');
		showTimedElem('td-error');
		return;
	}

	if ($('#password') === undefined || $('#password').val() == '') {
		$('#td-error').html('Please provide password.');
		showTimedElem('td-error');
		return;
	}

	$("#td-error").text("").append(getLoadingMini());
	
	var loginname = ($('#login').val().indexOf("@") > 0) ? $('#login').val().substring(0, $('#login').val().indexOf("@")) : $('#login').val();
	loginname = (loginname.indexOf("\\") > 0) ? loginname : "tamsdomain\\" + loginname;
	loginname=loginname.trim();
	userInfoData.AuthenticationHeader = Base64.encode(loginname + ":" + $('#password').val());
	var _url = serviceRootUrl + "svc.aspx?op=Authenticate&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader + "&currentURL=" + serviceRootUrl + "main.html"

	Jsonp_Call(_url, true, "callbackLogin");
	
}

function callbackLogin( data ){
	try {
	
		if (data.d.results.issuccess) 
		{
			userInfoData.DisplayName = data.d.results.name;
			userInfoData.Email = data.d.results.email;
			userInfoData.Phone = data.d.results.phone;
			userInfoData.UserID = data.d.results.userid;	
			$(".spanLoginUser").text("" +userInfoData.DisplayName);
			
			if ($('#rememberMe').is(':checked'))
				userInfoData.Expiration = getTimestamp() + 1210000000;	//2 weeks
			else
				userInfoData.Expiration = getTimestamp() + 14400000; //4 hours
			
			localstorage.set("userInfoData", userInfoData);
			
			NavigatePage("#pgHome");
		}
		else {
			userInfoData = localstorage.getUserInfoDefault();
			$('#td-error').html("Invalid login and/or password.");
		}
	}
	catch(err) {
		$('#td-error').html("Internal application error.");
	}
}


function performSearch()
{
	//alert("in");
	NavigatePageNoSlide("#pgRedirect?url=#pgSearch");
	//location.reload();
}

function searchAction()
{
	var userInfoData=localstorage.get("userInfoData");
	$( "#divSearchResults" ).text("").append( getLoadingImg() );
	
	userSearchText = $("#searchCatalogs").val();
	userSearchSortBy = $("#userSearchSortBy").val();

	var searchURL = serviceRootUrl + "svc.aspx?op=SearchProjects&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&userid=" + userInfoData.UserID + "&searchText=" + userSearchText + "&sortby=" + userSearchSortBy;
	
	Jsonp_Call(searchURL, false, "callbackPopulateSearchResults");
}

function callbackPopulateSearchResults(data)
{

	try {
		
		$( "#divSearchResults" ).text("");
		
		if (data.d.results.length > 0)
		{
			for(var i=0; i < data.d.results.length; i++)
			{
		
				var catalog = data.d.results[i];
				var temp = "";
				
				var ModalityColorCode="Transparent";
				/*switch (catalog.OpportunityModality)
				{
					case 'CT':
					ModalityColorCode='green';
					break;
					case 'MR':
					ModalityColorCode='blue';
					break;
					case 'UL':
					ModalityColorCode='red';
					break;
					case 'VL':
					ModalityColorCode='violet';
					break;
					case 'XR':
					ModalityColorCode='orange';
					break;
					default:
					ModalityColorCode='Transparent';
					break;
				}*/
				
				//<a data-mini="true" data-inline="true" data-role="button" href="javascript: addStatusAction('+catalog.ID+');" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" class="ui-btn ui-shadow ui-btn-corner-all ui-mini ui-btn-inline ui-btn-up-c">
					

					//installation status
					var InstallationProgressIcon="";
					if (catalog.InstallationProgress)
					{
						switch (catalog.InstallationProgress.toUpperCase())
						{
							case "COMPLETE":
								InstallationProgressIcon="glyhicon-ok.png";
								break;
							case "ON TARGET":
								InstallationProgressIcon="glyhicon-stop-green.png";
								break;
							default:
								InstallationProgressIcon="glyhicon-stop-red.png";
								break;
						}
					}
					else
					{
						InstallationProgressIcon="glyhicon-stop-red.png";
					
					}					
										
					//site readiness status
					var ConstructionProgressIcon="";

					if (catalog.ConstructionProgress)
					{					
	
						switch (catalog.ConstructionProgress.toUpperCase())
						{
							case "COMPLETE":
								ConstructionProgressIcon="glyhicon-ok.png";
								break;
							case "ON TARGET":
								ConstructionProgressIcon="glyhicon-stop-green.png";
								break;
							default:
								ConstructionProgressIcon="glyhicon-stop-red.png";
								break;
						}
					}
					else
					{
						ConstructionProgressIcon="glyhicon-stop-red.png";
					
					}					
					
					
					//finance status
					var FinanceProgressIcon="";					
					if (catalog.FinanceProgress)
					{					
						switch (catalog.FinanceProgress.toUpperCase())
						{
							case "COMPLETE":
								FinanceProgressIcon="glyhicon-ok.png";
								break;
							case "ON TARGET":
								FinanceProgressIcon="glyhicon-stop-green.png";
								break;
							default:
								FinanceProgressIcon="glyhicon-stop-red.png";
								break;
								
						}
					}
					else
					{
						FinanceProgressIcon="glyhicon-stop-red.png";
					
					}
					
					
					//booking status
					var BookStatusIcon="";					
					if (catalog.BookStatus)
					{					
						switch (catalog.BookStatus.toUpperCase())
						{
							case "APPROVED":
								BookStatusIcon="glyhicon-ok.png";
								break;
							case "CONTINGENT":
								BookStatusIcon="empty_icon.gif";
								break;							
							case "C":
								BookStatusIcon="glyhicon-stop-green.png";
								break;
							case "UNAPPROVED":
								BookStatusIcon="glyhicon-stop-red.png";
								break;
							case "FORECASTED":
								BookStatusIcon="empty_icon.gif";
								break;
							case "":
								BookStatusIcon="glyhicon-flag.png";
								break;
							default:
								BookStatusIcon="glyhicon-flag.png";
								break;
						}
					}
					else
					{
								BookStatusIcon="glyhicon-flag.png";
					}
					//Powered On Status
					var PowerOnIcon="";					
					if (!catalog.RDOPowerOn)
					{					
								PowerOnIcon="empty_icon.gif";
					}
					else {					

								PowerOnIcon="glyhicon-ok.png";
					}

					
					//Cfg. Validated Status
					var ConfigIcon="";					
					if (catalog.Config)
					{					
						switch (catalog.Config.toUpperCase())
						{
							case "VALID":
								ConfigIcon="glyhicon-ok.png";
								break;
							case "INVALID":
								ConfigIcon="glyhicon-remove.png";
								break;							
							default:
								ConfigIcon="glyhicon-exclamation.png";
								break;
						}
					}
					else
					{
								ConfigIcon="glyhicon-exclamation.png";
					}

					//Cfm. Delivery Status            
					var DeliveryIcon="";					
					
					var confirmedDeliveryDate =new Date();
					var siteReadyDate = new Date();
					
					if (catalog.ConfirmedDeliveryDate)
						confirmedDeliveryDate = new Date(catalog.ConfirmedDeliveryDate);
					if (catalog.ForecastedSiteReadyDate)
						siteReadyDate = new Date(catalog.ForecastedSiteReadyDate);


			
					if (catalog.ConfirmedDeliveryDate && catalog.ForecastedSiteReadyDate)
					{

						if ((siteReadyDate - confirmedDeliveryDate)/(1000*60*60*24) >= 0)
						{
								DeliveryIcon="glyhicon-ok.png";
						}
						else
						{
								DeliveryIcon="glyhicon-flag.png";
						}    					
					}
					else if (catalog.ConfirmedDeliveryDate && !catalog.ForecastedSiteReadyDate)
					{
								DeliveryIcon="glyhicon-ok.png";
					
					}
					else 
					{
								DeliveryIcon="empty_icon.gif";
 					
					}	

					//EMRF Status
					var EMRFIcon="";
					var RiggersDate = new Date();
					var Now = new Date();
					if (catalog.RiggersDate)
						RiggersDate = new Date(catalog.RiggersDate);
		
					if (catalog.RiggersDate)
					{
						if ((RiggersDate - Now)/(1000*60*60*24) <= 14)
						{
							if (parseInt(catalog.NumberOfEMRs) > 0)
							{
								EMRFIcon="glyhicon-stop-green.png";
							}
							else
							{
								EMRFIcon="glyhicon-stop-red.png";
							}
						}
						else
						{
							if (parseInt(catalog.NumberOfEMRs) > 0)
							{
								EMRFIcon="glyhicon-stop-green.png";
							}
							else
							{
								EMRFIcon="empty_icon.gif";
							}
						}
					}
					else if (parseInt(catalog.NumberOfEMRs) > 0)
					{
								EMRFIcon="glyhicon-stop-green.png";
					}
					else
					{
								EMRFIcon="empty_icon.gif";
					}


					if (catalog.Confidence < ConfidenceLevel)
						temp += '<table class="search-item" ><tr><td style="width:3px;background: -webkit-linear-gradient(bottom, rgba(222,0,0,1) 0%, rgba(222,222,222,1) '+ catalog.Confidence +'%, rgba(255,255,255,1) '+ catalog.Confidence +'%);">&nbsp;</td>';
					else
						temp += '<table class="search-item" ><tr><td style="width:3px;background: -webkit-linear-gradient(bottom, rgba(0,222,0,1) 0%, rgba(222,222,222,1) '+ catalog.Confidence +'%, rgba(255,255,255,1) '+ catalog.Confidence +'%);">&nbsp;</td>';
//					temp += '<table class="search-item" ><tr><td style="width:3px;background-color:'+ ModalityColorCode +'">&nbsp;</td>';
//					temp += '<table class="search-item" ><tr>';
					temp += '<td><div id="ProjectCard" class="panel-body" style="padding-bottom: 0;padding-left 2px;">';
					temp += '<a href="#" onclick="EditProjectDetailsAction('+catalog.ProjectID+');" style="text-decoration:none;color: inherit; display: block;">'
					temp += '<h2 style="color: blue; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6">';
					if (catalog.RoomNumber!='')
						temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.RoomNumber+'</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h6 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h6>';


					temp += '<style>.tblDashboard {margin-top: 0px; margin-bottom: 0px;font-size:xx-small;} .tblDashboard td{text-align:center;border: 1px solid lightgrey;width:50px;font-size:xx-small !important;}</style>';
					temp += '<table  class="tblDashboard" cellpadding=0 border=0 cellspacing=0><tr>';
					temp += '<td style="border: 0px;"></td><td>BK</td><td>FN</td><td>CV</td><td>CD</td></tr>'
					temp += '<tr style="height:25px;"><td style="border: 0px;"></td><td><img src="Images/'+BookStatusIcon+'" border=0></td><td><img src="Images/'+FinanceProgressIcon+'" border=0></td><td><img src="Images/'+ConfigIcon+'" border=0></td><td><img src="Images/'+DeliveryIcon+'" border=0></td></tr>'
					temp += '<tr><td>Conf.Level</td><td>SR</td><td>EM</td><td>IN</td><td>PO</td></tr>';
					temp += '<tr style="height:25px;"><td>'+catalog.Confidence+'</td><td><img src="Images/'+ConstructionProgressIcon+'" border=0></td><td><img src="Images/'+EMRFIcon+'" border=0></td><td><img src="Images/'+InstallationProgressIcon+'" border=0></td><td><img src="Images/'+PowerOnIcon+'" border=0></td></tr></table>';

					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified + catalog.ModifiedByFullName +'</em></h6>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>IPM Update: ' + catalog.LastIPMUpdate + catalog.LastIPMUpdateBy +'</em></h6>';


					temp += '</div></div></div>';
					temp += '</td></tr></table>';


				$( "#divSearchResults" ).append(temp);
			}
			

		}
		else
		{
			//no item
			var temp = "<br /><center>No item found.</center>";
			
			temp += "<br />";			
			if (userSearchText != "")
				temp += "<div><center><i>Keyword:</i> <b>"+ userSearchText +"</b></center></div>";


			$( "#divSearchResults" ).text("").append(temp);
		}
	}
	catch(err) {
		$( "#divSearchResults" ).text("").append("Internal application error.");
	}
}





/******************* Project Options ***********************/

function GoToProjectDetails() {
	var ProjectID= ($.urlParam("ProjectID"));
	NavigatePage('#pgProjectDetails?id=' + ProjectID);
}
/******************* Swipe Project Options ***********************/
$(document).on('pageinit',"#pgProjectOptions",function(event){

	$("#pgProjectOptions").on("swipeleft",function(){
		$("#pnlProjectDetails-ProjectOptions").panel( "open");
	});
	$("#pgProjectOptions").on("swiperight",function(){
		$("#pnlProjectActivity-ProjectOptions").panel( "open");
	});
});



function callbackLoadProjectOptionsSidePanelIPMActivity(data)
{


	try {

		
		if (data.d.results.length > 0)
		{
			var temp = '<div class="ui-grid-b ui-responsive" id="ProjectOptionsGridSidePanel" name="ProjectOptionsGridSidePanel" style="padding-right:10px;">';
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				temp += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>';

			}
			
			temp += '</div>';

			$("#pnlProjectActivity-ProjectOptions" ).html(temp);

					
		}
		else
		{
			//
		}
	}
	catch(err) {}
}


function callbackLoadProjectOptionsSidePanel(data)
{



	try {

	
			if (data.d.results.length > 0)
			{

				var temp = "";
				
				var catalog = data.d.results[0];
				
					temp += '<table class="search-item" ><tr><td style="width:3px;">&nbsp;</td><td>';
					temp += '<div id="ProjectCard" class="panel-body" style="padding-bottom: 0px;padding-top: 30px;">';
					temp += ''
					temp += '<h2 style="color: silver; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6">';
					if (catalog.RoomNumber!='')
						temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.RoomNumber+'</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified + catalog.ModifiedByFullName +'</em></h6>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>IPM Update: ' + catalog.LastIPMUpdate + catalog.LastIPMUpdateBy +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';
					
				$("#pnlProjectDetails-ProjectOptions" ).html(temp);

				
			}
		}
	catch(err) {}
}



/******************* TapHold Login ***********************/
$(document).on('pageinit',"#pgLogin",function(event){
	$("#AppName").on("taphold",function(){
		$("#pnlSideShow").html(GetpnlSideShow());
		$("#pnlSideShow").panel( "open");
		
	});

});

/******************* Swipe Construction ***********************/
$(document).on('pageinit',"#pgConstruction",function(event){

	$("#pgConstruction").on("swipeleft",function(){
		$("#pnlProjectDetails").panel( "open");
	});
	$("#pgConstruction").on("swiperight",function(){
		$("#pnlProjectActivity").panel( "open");
	});
});

/******************* Swipe IPM Activity ***********************/
$(document).on('pageinit',"#pgIPMActivity",function(event){

	$("#pgIPMActivity").on("swipeleft",function(){
		$("#pnlProjectDetails-IPMActivity").panel( "open");
	});
	$("#pgIPMActivity").on("swiperight",function(){
		$("#pnlProjectActivity-IPMActivity").panel( "open");
	});
});

/******************* Swipe SPR ***********************/
$(document).on('pageinit',"#pgSitePlanRequests",function(event){

	$("#pgSitePlanRequests").on("swipeleft",function(){
		$("#pnlProjectDetails-SitePlanRequests").panel( "open");
	});
	$("#pgSitePlanRequests").on("swiperight",function(){
		$("#pnlProjectActivity-SitePlanRequests").panel( "open");
	});
});


/******************* Swipe EMRF ***********************/
$(document).on('pageinit',"#pgEMRF",function(event){

	$("#pgEMRF").on("swipeleft",function(){
		$("#pnlProjectDetails-EMRF").panel( "open");
	});
	$("#pgEMRF").on("swiperight",function(){
		$("#pnlProjectActivity-EMRF").panel( "open");
	});
});

/******************* Swipe EquipmentList ***********************/
$(document).on('pageinit',"#pgEquipmentList",function(event){

	$("#pgEquipmentList").on("swipeleft",function(){
		$("#pnlProjectDetails-EquipmentList").panel( "open");
	});
	$("#pgEquipmentList").on("swiperight",function(){
		$("#pnlProjectActivity-EquipmentList").panel( "open");
	});
});


/******************* Load EquipmentList ***********************/
$( document ).on( "pagebeforeshow", "#pgEquipmentList", function(event) {
	checkUserLogin();
	
	
	
	$('#tblEquipmentList').hide();
	$('#tblEquipmentListButtons').hide();

	$('#error-div-EquipmentList').text("").append(getLoadingMini());
//	$("#ddlSortBy-EquipmentList").val('ShipToSite').selectmenu('refresh', true);
	$("#txtEmailAddress").val('');

			
	$('#divCollapsibleregular').collapsible( "option", 'collapsed',true );
	$('#divCollapsiblebelow').collapsible( "option", 'collapsed',true );
	$('#divCollapsiblevital').collapsible( "option", 'collapsed',true );
	$('#divCollapsiblepower').collapsible( "option", 'collapsed',true );
	//$("#EquipmentListGrid").text('');
	//$("#EquipmentListGrid-regular").text('');
	//$("#EquipmentListGrid-below").text('');
	//$("#EquipmentListGrid-vital").text('');
	//$("#EquipmentListGrid-power").text('');
	
	$('#EquipmentListGrid-regular tbody').children("tr").remove();
	$('#EquipmentListGrid-below tbody').children("tr").remove();
	$('#EquipmentListGrid-vital tbody').children("tr").remove();
	$('#EquipmentListGrid-power tbody').children("tr").remove();
	
	$('a[href="#EquipmentListGrid-regular-popup"]').hide();
	$('a[href="#EquipmentListGrid-below-popup"]').hide();
	$('a[href="#EquipmentListGrid-vital-popup"]').hide();
	$('a[href="#EquipmentListGrid-power-popup"]').hide();
	
	
	var id = $.urlParam("id");
	if (id > 0)
	{
		var _url= serviceRootUrl + "svc.aspx?op=GetEquipmentListCounts&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id ;
		Jsonp_Call(_url, false, "callbackLoadEquipmentListCounts");
	
		var _url2 = serviceRootUrl + "svc.aspx?op=GetEquipmentList&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id + "&equipmenttype=regular" ;
		Jsonp_Call(_url2, false, "callbackLoadEquipmentList_regular");

		var _url3 = serviceRootUrl + "svc.aspx?op=GetEquipmentList&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id + "&equipmenttype=below" ;
		Jsonp_Call(_url3, false, "callbackLoadEquipmentList_below");

		var _url4 = serviceRootUrl + "svc.aspx?op=GetEquipmentList&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id + "&equipmenttype=vital" ;
		Jsonp_Call(_url4, false, "callbackLoadEquipmentList_vital");

		var _url5 = serviceRootUrl + "svc.aspx?op=GetEquipmentList&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id + "&equipmenttype=power" ;
		Jsonp_Call(_url5, false, "callbackLoadEquipmentList_power");
		


		}
	else 
	{
		///
			alert("App Error");
	}
	

	
});


function callbackLoadEquipmentListCounts(data)
{


	try {


				var catalog = data.d.results[0];
/*
				$('#RegularCount').html('Regular Equipment List   <span style="text-align:right;float:right;font-size:xx-small;color:blue;">' + (parseInt(catalog.RegularCount)>0 ? catalog.RegularCount + ' item(s)' : '') +'</span>');
				$('#BelowCount').html('Below the Line Items   <span style="text-align:right;float:right;font-size:xx-small;color:blue;">' + (parseInt(catalog.BelowCount)>0 ? catalog.BelowCount + ' item(s)' : '') + '</span>');
				$('#VitalCount').html('Vital Items   <span style="text-align:right;float:right;font-size:xx-small;color:blue;">' + (parseInt(catalog.VitalCount)>0 ? catalog.VitalCount + ' item(s)' : '') + '</span>');
				$('#PowerCount').html('Powerware Items   <span style="text-align:right;float:right;font-size:xx-small;color:blue;">' + (parseInt(catalog.PowerCount)>0 ? catalog.PowerCount + ' item(s)' : '') + '</span>');
*/
				$('#RegularCount').html('Regular Equipment List ' + (parseInt(catalog.RegularCount)>0 ? '(' + catalog.RegularCount + ')' : '') );
				$('#BelowCount').html('Below the Line Items ' + (parseInt(catalog.BelowCount)>0 ? '(' + catalog.BelowCount + ')' : '') );
				$('#VitalCount').html('Vital Items ' + (parseInt(catalog.VitalCount)>0 ? '(' + catalog.VitalCount + ')' : '') );
				$('#PowerCount').html('Powerware Items ' + (parseInt(catalog.PowerCount)>0 ? '(' + catalog.PowerCount + ')' : ''));


	}
	catch(err) {}
}
function callbackLoadEquipmentList_below(data)
{


	try {


			
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];

				$('#EquipmentListGrid-below tbody').append('<tr><td>' + catalog.Item_Number + '</td><td>' + catalog.Description + '</td><td>' + catalog.Qty + '</td></tr>');

			}



	}
	catch(err) {}
}
function callbackLoadEquipmentList_vital(data)
{


	try {

			
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				
				$('#EquipmentListGrid-vital tbody').append('<tr><td>' + catalog.Item_Number + '</td><td>' + catalog.Description + '</td><td>' + catalog.Qty + '</td></tr>');

			}



	}
	catch(err) {}
}
function callbackLoadEquipmentList_power(data)
{


	try {


			
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				$('#EquipmentListGrid-power tbody').append('<tr><td>' + catalog.Item_Number + '</td><td>' + catalog.Description + '</td><td>' + catalog.Qty + '</td></tr>');
				

			}


			

	}
	catch(err) {}
}
function callbackLoadEquipmentList_regular(data)
{


	try {



			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
//				$('#EquipmentListGrid-regular tr:last').after('<tr><td>' + catalog.Item_Number + '</td><td>' + catalog.Description + '</td><td>' + catalog.Flow_Status_Code + '</td><td>' + catalog.Qty + '</td></tr>');
				$('#EquipmentListGrid-regular tbody').append('<tr><td>' + catalog.Item_Number + '</td><td >' + catalog.Description + '</td><td>' + catalog.Flow_Status_Code + '</td><td>' + catalog.Qty + '</td></tr>');				

			}




											
			var id = $.urlParam("id");
			if (id > 0)
			{
				var _url1 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url1, true, "callbackLoadEquipmentListSidePanelIPMActivity");

				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectHeaderById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url2, true, "callbackLoadEquipmentListSidePanel");

			}
			else 
			{
				///
					alert("App Error");
			}
					

	}
	catch(err) {}
}

function callbackLoadEquipmentListSidePanelIPMActivity(data)
{


	try {

		
		if (data.d.results.length > 0)
		{
			var temp = '<div class="ui-grid-b ui-responsive" id="EquipmentListGridSidePanel" name="EquipmentListGridSidePanel" style="padding-right:10px;">';
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				temp += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>';

			}
			
			temp += '</div>';

			$("#pnlProjectActivity-EquipmentList" ).html(temp);

					
		}
		else
		{
			//
		}
	}
	catch(err) {}
}


function callbackLoadEquipmentListSidePanel(data)
{



	try {

	
			if (data.d.results.length > 0)
			{

				var temp = "";
				
				var catalog = data.d.results[0];
				
					temp += '<table class="search-item" ><tr><td style="width:3px;">&nbsp;</td><td>';
					temp += '<div id="ProjectCard" class="panel-body" style="padding-bottom: 0px;padding-top: 30px;">';
					temp += ''
					temp += '<h2 style="color: silver; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6">';
					if (catalog.RoomNumber!='')
						temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.RoomNumber+'</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified + catalog.ModifiedByFullName +'</em></h6>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>IPM Update: ' + catalog.LastIPMUpdate + catalog.LastIPMUpdateBy +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';
					
				$("#pnlProjectDetails-EquipmentList" ).html(temp);


				$('#error-div2-EquipmentList').text("");
				$('#error-div-EquipmentList').text("");
					
				$('#tblEquipmentList').show();
				$('#tblEquipmentListButtons').show();
				
			}
		}
	catch(err) {}
}



function cancelStatusEquipmentList() {

		NavigatePage('#pgHome');


}
function backStatusEquipmentList() {

		GoToSectionWithID('ProjectOptions');

}

function EmailEquipmentList() {

	if ($("#txtEmailAddress").val() != ""){		

		$scope = {
			recordId : $.urlParam("id"),
			txtEmailAddress : $("#txtEmailAddress").val()
		};


		var	confirmMessage="";

		
		confirmMessage=confirmMessage + "Email equipment list and go back to project options?";
		$('<div>').simpledialog2({
			mode: 'blank',
			headerText: 'Email equipment list',
			headerClose: false,
			transition: 'flip',
			themeDialog: 'a',
			width: 300,
			zindex: 2000,
			blankContent : 
			  "<div style='padding: 15px;'><p>" + confirmMessage + "</p>"+
			  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"EmailEquipmentListProcess('" + 'a' + "');\">OK</a></td>" + 
			  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
		});
		
	}
	else
	{
		alert("Please enter email addresses.");
	}
	
}

	
function EmailEquipmentListProcess(a)
{
	if ($scope) {
	
		//show saving animation
		$('#error-div-EquipmentList').text("").append(getLoadingMini());
		showTimedElem('error-div-EquipmentList');

		
		$('#tblEquipmentList').hide();
		$('#tblEquipmentListsButtons').hide();

		if ($scope.recordId != "" && parseInt($scope.recordId) > 0)
		{
			//showLoading(true);
			var _url =  serviceRootUrl + "svc.aspx?op=EmailEquipmentList&SPUrl=" + spwebRootUrl + "sites/busops&id=" + $scope.recordId + "&emailaddress=" + $scope.txtEmailAddress+ "&username=" + userInfoData.Email + "&userid=" + userInfoData.UserID + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
			
			console.log(_url);
			
			Jsonp_Call(_url, true, "callbackEmailEquipmentList");
		}


		
	}
}

function callbackEmailEquipmentList(data)
{
	try {

			$('#error-div2-EquipmentList').text("");
			$('#error-div-EquipmentList').text("");
			GoToSectionWithID('ProjectOptions');

	}
	catch(err) { }
}


/******************* Load EMRF ***********************/
$( document ).on( "pagebeforeshow", "#pgEMRF", function(event) {
	checkUserLogin();
	
	
	
	$('#tblEMRF').hide();
	$('#tblEMRFButtons').hide();


	$('#error-div-EMRF').text("").append(getLoadingMini());
	
	//$('#ddlEquipmentType option[value!="-1"]').remove();
	$("#ddlEquipmentType").val('-1').selectmenu('refresh', true);
	$('#divEquipmentType').hide();
	
	$("#EMRFGrid").text("");
	var id = $.urlParam("id");
	if (id > 0)
	{
	
		var _url2 = serviceRootUrl + "svc.aspx?op=GetEMRF&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id ;
		Jsonp_Call(_url2, false, "callbackLoadEMRF");
	}
	else 
	{
		///
			alert("App Error");
	}

});


function callbackLoadEMRF(data)
{


	try {


//		if (data.d.results.length > 0)
//		{
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				var TableRow = $('<div style="width:100%;margin: 5px 0px 5px 0px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ShipToSite +'</span><br><span style="font-size:x-small;">'+ catalog.Status +' - '+ catalog.SentToTCSubCategory+'</span><br><span style="font-size:x-small;">To:'+ catalog.ShipToAddress + catalog.ShipToCity+ catalog.ShipToState+ ' ' +catalog.ShipToZip+'</span><br><span style="font-size:x-small;">Requested Delivery Date:'+ catalog.DelvDate  +'</span><br><span style="font-size:x-small;">'+catalog.ItemDetail +'</span></div>');
				TableRow.appendTo($("#EMRFGrid"));
				

			}
			var id = $.urlParam("id");
			if (id > 0)
			{
				var _url1 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url1, true, "callbackLoadEMRFSidePanelIPMActivity");

				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectHeaderById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url2, true, "callbackLoadEMRFSidePanel");

			}
			else 
			{
				///
					alert("App Error");
			}
					
//		}

	}
	catch(err) {}
}

function callbackLoadEMRFSidePanelIPMActivity(data)
{


	try {

		
		if (data.d.results.length > 0)
		{
			var temp = '<div class="ui-grid-b ui-responsive" id="EMRFGridSidePanel" name="EMRFGridSidePanel" style="padding-right:10px;">';
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				temp += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>';

			}
			
			temp += '</div>';

			$("#pnlProjectActivity-EMRF" ).html(temp);

					
		}
		else
		{
			//
		}
	}
	catch(err) {}
}


function callbackLoadEMRFSidePanel(data)
{



	try {

	
			if (data.d.results.length > 0)
			{

				var temp = "";
				
				var catalog = data.d.results[0];
				
					temp += '<table class="search-item" ><tr><td style="width:3px;">&nbsp;</td><td>';
					temp += '<div id="ProjectCard" class="panel-body" style="padding-bottom: 0px;padding-top: 30px;">';
					temp += ''
					temp += '<h2 style="color: silver; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6">';
					if (catalog.RoomNumber!='')
						temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.RoomNumber+'</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified + catalog.ModifiedByFullName +'</em></h6>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>IPM Update: ' + catalog.LastIPMUpdate + catalog.LastIPMUpdateBy +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';
					
				$("#pnlProjectDetails-EMRF" ).html(temp);

				LoadEquipmentTypes(catalog.OpportunityModality);
				
				$("#btnAddEMRF").on("click", function(e) { 
					var EquipmentType=$("#ddlEquipmentType").val();
					var requestUrl = spwebRootUrl + 'virtualapps/busopswebs/emr/MoveRequest.aspx?projectId=' + catalog.ProjectID + '&sid=' + catalog.SID + '&modality=' + catalog.OpportunityModality + '&equipment=' + EquipmentType + '&source=BillTrak';	
					
					if (EquipmentType=='-1')
						alert("Please select Equipment Type");		
					else
						window.open(requestUrl, '_system');//alert(requestUrl );		
					
				});
				//var requestUrl = url + '?projectId=' + pid + '&sid=' + sid + '&modality=' + mdl + '&equipment=' + eqp + '&source=BillTrak';
                //var requestUrl = 'http://localhost:8268/MoveRequest.aspx?projectId=' + pid + '&sid=' + sid + '&modality=' + mdl + '&equipment=' + eqp + '&source=BillTrak';

				

				$('#error-div2-EMRF').text("");
				$('#error-div-EMRF').text("");
				
				$('#divEquipmentType').show();
				$('#tblEMRF').show();
				$('#tblEMRFButtons').show();
				
			}
		}
	catch(err) {}
}

function LoadEquipmentTypes(Modality)
{
	var _url = serviceRootUrl + "svc.aspx?op=GetEquipmentTypes&SPUrl=" + spwebRootUrl + "sites/busops" + "&modality=" + Modality + "&username=" + userInfoData.Email;
	Jsonp_Call(_url, true, "callbackPopulateEquipmentTypes");	
}

function callbackPopulateEquipmentTypes(data)
{
	try {
		if (data.d.results.length > 0)
		{
			$('#ddlEquipmentType option[value!="-1"]').remove();
			
			for (var i = 0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				$("#ddlEquipmentType").append("<option value='" + catalog.LookUpID + "'>" + catalog.DisplayName + "</option>");
			}		
			$("#ddlEquipmentType").val('-1').selectmenu('refresh', true);

		}
	}
	catch(err) {}
}

function cancelStatusEMRF() {

		NavigatePage('#pgHome');


}
function backStatusEMRF() {

		GoToSectionWithID('ProjectOptions');

}

/******************* Swipe Contacts ***********************/
$(document).on('pageinit',"#pgContacts",function(event){

	$("#pgContacts").on("swipeleft",function(){
		$("#pnlProjectDetails-Contacts").panel( "open");
	});
	$("#pgContacts").on("swiperight",function(){
		$("#pnlProjectActivity-Contacts").panel( "open");
	});
});
/******************* Load Contacts ***********************/
$( document ).on( "pagebeforeshow", "#pgContacts", function(event) {
	checkUserLogin();
	
	
	
	$('#tblContacts').hide();
	$('#tblContactsButtons').hide();

	$('#error-div-Contacts').text("").append(getLoadingMini());
	//$("#ddlSortBy-Contacts").val('ShipToSite').selectmenu('refresh', true);

		
	$("#ContactsGrid").text("");
	$("#ContactsTeamGrid").text("");
	var id = $.urlParam("id");
	if (id > 0)
	{
	
		var _url2 = serviceRootUrl + "svc.aspx?op=GetContacts&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id ;
		Jsonp_Call(_url2, false, "callbackLoadContacts");
		
		var _urlTeam = serviceRootUrl + "svc.aspx?op=GetContactsTeam&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id ;
		Jsonp_Call(_urlTeam, false, "callbackLoadContactsTeam");

	}
	else 
	{
		///
			alert("App Error");
	}
	

	
});

function callbackLoadContactsTeam(data)
{
	try {
			

			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[0];
				var ContactsTeam="";
				if (catalog.AE && catalog.AE!='')
				{

					ContactsTeam=ContactsTeam+'<div style="width:100%;" class="bubble ui-block-a my-breakpoint ui-responsive" id="contactsteam"><div>';
					ContactsTeam=ContactsTeam+'<div style="float:left;">';
					if (catalog.AEPicture.substring(0,7)=='<nopic>')
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src="Images/person.gif">';}
					else
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src=data:image/jpg;base64,"'+catalog.AEPicture+'" >';}
					ContactsTeam=ContactsTeam+'</div><div><span style="font-size:small;font-weight:bold;">'+catalog.AE+'</span><br><span style="font-size:small;font-weight:bold;">AE</span><br><span style="font-size:x-small;">Phone: <a href="tel:'+catalog.AEPhone+'">'+catalog.AEPhone+'</a></span></div>';
					ContactsTeam=ContactsTeam+'</div></div>';

				}

				if (catalog.ZBM && catalog.ZBM!='')
				{

					ContactsTeam=ContactsTeam+'<div style="width:100%;" class="bubble ui-block-a my-breakpoint ui-responsive" id="contactsteam"><div>';
					ContactsTeam=ContactsTeam+'<div style="float:left;">';
					if (catalog.ZBMPicture.substring(0,7)=='<nopic>')
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src="Images/person.gif">';}
					else
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src=data:image/jpg;base64,"'+catalog.ZBMPicture+'" >';}
					ContactsTeam=ContactsTeam+'</div><div><span style="font-size:small;font-weight:bold;">'+catalog.ZBM+'</span><br><span style="font-size:small;font-weight:bold;">ZBM</span><br><span style="font-size:x-small;">Phone: <a href="tel:'+catalog.ZBMPhone+'">'+catalog.ZBMPhone+'</a></span></div>';
					ContactsTeam=ContactsTeam+'</div></div>';

				}
				if (catalog.ASM && catalog.ASM!='')
				{

					ContactsTeam=ContactsTeam+'<div style="width:100%;" class="bubble ui-block-a my-breakpoint ui-responsive" id="contactsteam"><div>';
					ContactsTeam=ContactsTeam+'<div style="float:left;">';
					if (catalog.ASMPicture.substring(0,7)=='<nopic>')
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src="Images/person.gif">';}
					else
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src=data:image/jpg;base64,"'+catalog.ASMPicture+'" >';}
					ContactsTeam=ContactsTeam+'</div><div><span style="font-size:small;font-weight:bold;">'+catalog.ASM+'</span><br><span style="font-size:small;font-weight:bold;">ASM</span><br><span style="font-size:x-small;">Phone: <a href="tel:'+catalog.ASMPhone+'">'+catalog.ASMPhone+'</a></span></div>';
					ContactsTeam=ContactsTeam+'</div></div>';

				}				
				if (catalog.ZVPSales && catalog.ZVPSales!='')
				{

					ContactsTeam=ContactsTeam+'<div style="width:100%;" class="bubble ui-block-a my-breakpoint ui-responsive" id="contactsteam"><div>';
					ContactsTeam=ContactsTeam+'<div style="float:left;">';
					if (catalog.ZVPSalesPicture.substring(0,7)=='<nopic>')
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src="Images/person.gif">';}
					else
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src=data:image/jpg;base64,"'+catalog.ZVPSalesPicture+'" >';}
					ContactsTeam=ContactsTeam+'</div><div><span style="font-size:small;font-weight:bold;">'+catalog.ZVPSales+'</span><br><span style="font-size:small;font-weight:bold;">ZVP Sales</span><br><span style="font-size:x-small;">Phone: <a href="tel:'+catalog.ZVPSalesPhone+'">'+catalog.ZVPSalesPhone+'</a></span></div>';
					ContactsTeam=ContactsTeam+'</div></div>';

				}
				if (catalog.ZVPService && catalog.ZVPService!='')
				{

					ContactsTeam=ContactsTeam+'<div style="width:100%;" class="bubble ui-block-a my-breakpoint ui-responsive" id="contactsteam"><div>';
					ContactsTeam=ContactsTeam+'<div style="float:left;">';
					if (catalog.ZVPServicePicture.substring(0,7)=='<nopic>')
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src="Images/person.gif">';}
					else
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src=data:image/jpg;base64,"'+catalog.ZVPServicePicture+'" >';}
					ContactsTeam=ContactsTeam+'</div><div><span style="font-size:small;font-weight:bold;">'+catalog.ZVPService+'</span><br><span style="font-size:small;font-weight:bold;">ZVP Service</span><br><span style="font-size:x-small;">Phone: <a href="tel:'+catalog.ZVPServicePhone+'">'+catalog.ZVPServicePhone+'</a></span></div>';
					ContactsTeam=ContactsTeam+'</div></div>';

				}
				if (catalog.CE && catalog.CE!='')
				{

					ContactsTeam=ContactsTeam+'<div style="width:100%;" class="bubble ui-block-a my-breakpoint ui-responsive" id="contactsteam"><div>';
					ContactsTeam=ContactsTeam+'<div style="float:left;">';
					if (catalog.CEPicture.substring(0,7)=='<nopic>')
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src="Images/person.gif">';}
					else
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src=data:image/jpg;base64,"'+catalog.CEPicture+'" >';}
					ContactsTeam=ContactsTeam+'</div><div><span style="font-size:small;font-weight:bold;">'+catalog.CE+'</span><br><span style="font-size:small;font-weight:bold;">CE</span><br><span style="font-size:x-small;">Phone: <a href="tel:'+catalog.CEPhone+'">'+catalog.CEPhone+'</a></span></div>';
					ContactsTeam=ContactsTeam+'</div></div>';

				}
				if (catalog.IPM && catalog.IPM!='')
				{

					ContactsTeam=ContactsTeam+'<div style="width:100%;" class="bubble ui-block-a my-breakpoint ui-responsive" id="contactsteam"><div>';
					ContactsTeam=ContactsTeam+'<div style="float:left;">';
					if (catalog.IPMPicture.substring(0,7)=='<nopic>')
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src="Images/person.gif">';}
					else
						{ContactsTeam=ContactsTeam+'<img style="padding:2px;" alt="" title="" border=0 width=60px height=60px src=data:image/jpg;base64,'+catalog.IPMPicture+' />';}
					ContactsTeam=ContactsTeam+'</div><div><span style="font-size:small;font-weight:bold;">'+catalog.IPM+'</span><br><span style="font-size:small;font-weight:bold;">IPM</span><br><span style="font-size:x-small;">Phone: <a href="tel:'+catalog.IPMPhone+'">'+catalog.IPMPhone+'</a></span></div>';
					ContactsTeam=ContactsTeam+'</div></div>';

				}

				var TableRow = $(ContactsTeam + ' ');

				TableRow.appendTo($("#ContactsTeamGrid"));
				

			}

					
		}

	catch(err) {}
}

function callbackLoadContacts(data)
{


	try {

//		if (data.d.results.length > 0)
//		{
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				var TableRow = $('<div style="width:100%;margin: 5px 0px 5px 0px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.Name +'</span><br><span style="font-size:x-small;">Phone: <a href="tel:' + catalog.Phone + '">'+ catalog.Phone +'</a></span></div>');
				TableRow.appendTo($("#ContactsGrid"));
				

			}

			var id = $.urlParam("id");
			if (id > 0)
			{
				var _url1 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url1, true, "callbackLoadContactsSidePanelIPMActivity");

				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectHeaderById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url2, true, "callbackLoadContactsSidePanel");

			}
			else 
			{
				///
					alert("App Error");
			}
					
		}

//	}
	catch(err) {}
}

function callbackLoadContactsSidePanelIPMActivity(data)
{


	try {

	
		if (data.d.results.length > 0)
		{
			var temp = '<div class="ui-grid-b ui-responsive" id="ContactsGridSidePanel" name="ContactsGridSidePanel" style="padding-right:10px;">';
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				temp += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>';

			}
			
			temp += '</div>';

			$("#pnlProjectActivity-Contacts" ).html(temp);

		}
		else
		{
			//
		}
	}
	catch(err) {}
}


function callbackLoadContactsSidePanel(data)
{



	try {
		
		
	
			if (data.d.results.length > 0)
			{

				var temp = "";
				
				var catalog = data.d.results[0];
				
					temp += '<table class="search-item" ><tr><td style="width:3px;">&nbsp;</td><td>';
					temp += '<div id="ProjectCard" class="panel-body" style="padding-bottom: 0px;padding-top: 30px;">';
					temp += ''
					temp += '<h2 style="color: silver; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6">';
					if (catalog.RoomNumber!='')
						temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.RoomNumber+'</h3>';					
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified + catalog.ModifiedByFullName +'</em></h6>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>IPM Update: ' + catalog.LastIPMUpdate + catalog.LastIPMUpdateBy +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';
				$("#pnlProjectDetails-Contacts" ).html(temp);


				$('#error-div2-Contacts').text("");
				$('#error-div-Contacts').text("");
					
				$('#tblContacts').show();
				$('#tblContactsButtons').show();
				
			}
			else
			{
				alert("App error");
			}
		}
	catch(err) {}
}



function cancelStatusContacts() {

		NavigatePage('#pgHome');


}
function backStatusContacts() {

		GoToSectionWithID('ProjectOptions');

}
/******************* Load Site Plan Requests ***********************/
$( document ).on( "pagebeforeshow", "#pgSitePlanRequests", function(event) {
	checkUserLogin();
	
	
	
	$('#tblSitePlanRequests').hide();
	$('#tblSitePlanRequestsButtons').hide();

	$('#error-div-SitePlanRequests').text("").append(getLoadingMini());
	//$("#ddlSortBy-SitePlanRequests").val('ProjectNumber').selectmenu('refresh', true);
		
	$("#SitePlanRequestsGrid").text("");
	var id = $.urlParam("id");

	if (id > 0)
	{
	
		var _url2 = serviceRootUrl + "svc.aspx?op=GetSitePlanRequests&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id ;
		Jsonp_Call(_url2, false, "callbackLoadSitePlanRequests");
	}
	else 
	{
		///
			alert("App Error");
	}
	

	
});



function callbackLoadSitePlanRequests(data)
{


	try {

		
//		if (data.d.results.length > 0)
//		{
			var PrevSPRID="";
			var SPRRow="";
			
			for(var i=0; i < data.d.results.length; i++)
			{
			
				var catalog = data.d.results[i];
				var CurrentSPRID=catalog.SPRID;
				
				if (CurrentSPRID!=PrevSPRID && i > 0)
				{
					SPRRow = SPRRow +'</div >';
				}

				if (CurrentSPRID!=PrevSPRID  && i > 0)
				{
					var TableRow = $(SPRRow+'');
					TableRow.appendTo($("#SitePlanRequestsGrid"));
				}			

				if (CurrentSPRID!=PrevSPRID || i==0)
				{
				SPRRow = '<div style="width:100%;margin: 5px 0px 5px 0px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ProjectNumber +' - '+ catalog.DrawingType +' - '+ catalog.Status +'</span><br><span style="font-size:x-small;">IPM: '+ catalog.IPM_Assigned  +'</span>';
				if (catalog.Planner_Assigned && catalog.Planner_Assigned!="")
					{
						SPRRow = SPRRow + '<br><span style="font-size:x-small;">Planner: '+catalog.Planner_Assigned +'</span>';
					}
				}
				
				
				if (catalog.FileName && catalog.FileName!="")
					SPRRow = SPRRow + '<BR><span style="font-size:x-small;"><a href="#" onclick=DownloadSPRDocument('+catalog.DocumentID+');>Download ' + catalog.FileName + '.' + catalog.Extension +'</a></span>';

				if (i == data.d.results.length-1)
				{
					SPRRow = SPRRow +'</div >';
					var TableRow = $(SPRRow+'');
					TableRow.appendTo($("#SitePlanRequestsGrid"));
				}
				

				PrevSPRID=CurrentSPRID;

				


			}

			var id = $.urlParam("id");
			if (id > 0)
			{
				var _url1 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url1, true, "callbackLoadSitePlanRequestsSidePanelIPMActivity");

				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectHeaderById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url2, true, "callbackLoadSitePlanRequestsSidePanel");

			}
			else 
			{
				///
					alert("App Error");
			}
					
//		}

	}
	catch(err) {}
}

function DownloadSPRDocument(DocID)
{


	try {
			var _url =  serviceRootUrl + "svc.aspx?op=DownloadSitePlanningRequestDocuments&SPUrl=" + spwebRootUrl + "&id=" + DocID + "&username=" +  userInfoData.Email;
			window.open(_url, '_blank', 'EnableViewPortScale=yes');
			//Jsonp_Call(_url, true, "");
			
		}

	catch(err) {}
}

function callbackLoadSitePlanRequestsSidePanelIPMActivity(data)
{


	try {

	
		if (data.d.results.length > 0)
		{
			var temp = '<div class="ui-grid-b ui-responsive" id="SitePlanRequestsGridSidePanel" name="SitePlanRequestsGridSidePanel" style="padding-right:10px;">';
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				temp += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>';

			}
			
			temp += '</div>';

			$("#pnlProjectActivity-SitePlanRequests" ).html(temp);

					
		}
		else
		{
			//
		}
	}
	catch(err) {}
}


function callbackLoadSitePlanRequestsSidePanel(data)
{



	try {

	
			if (data.d.results.length > 0)
			{

				var temp = "";
				
				var catalog = data.d.results[0];
				
					temp += '<table class="search-item" ><tr><td style="width:3px;">&nbsp;</td><td>';
					temp += '<div id="ProjectCard" class="panel-body" style="padding-bottom: 0px;padding-top: 30px;">';
					temp += ''
					temp += '<h2 style="color: silver; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6">';
					if (catalog.RoomNumber!='')
						temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.RoomNumber+'</h3>';		
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified + catalog.ModifiedByFullName +'</em></h6>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>IPM Update: ' + catalog.LastIPMUpdate + catalog.LastIPMUpdateBy +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';
					
				$("#pnlProjectDetails-SitePlanRequests" ).html(temp);


				$('#error-div2-SitePlanRequests').text("");
				$('#error-div-SitePlanRequests').text("");
					
				$('#tblSitePlanRequests').show();
				$('#tblSitePlanRequestsButtons').show();
				
			}
		}
	catch(err) {}
}



function cancelStatusSitePlanRequests() {

		NavigatePage('#pgHome');


}
function backStatusSitePlanRequests() {

		GoToSectionWithID('ProjectOptions');

}




/******************* Add IPM Activity ***********************/
$( document ).on( "pagebeforeshow", "#pgIPMActivity", function(event) {
	checkUserLogin();
	
	
	
	$('#tblIPMActivity').hide();
	$('#tblIPMActivityButtons').hide();

	$('#error-div-IPMActivity').text("").append(getLoadingMini());
	
	$("#tblIPMActivity").find("input").each(function() {
		if ($(this).attr("type") == "text" )
			$(this).val("");
		if ($(this).attr("type") == "date")
			$(this).val(NowDate());
			
	});	
	$("#ddlActivityType").val('7').selectmenu('refresh', true);
	$("#txtComments").val("");

	$("#IPMActivityGrid").text("");
	var id = $.urlParam("id");
	if (id > 0)
	{
	
		var _url2 = serviceRootUrl + "svc.aspx?op=GetIPMActivityWithAvatar&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
		Jsonp_Call(_url2, false, "callbackLoadIPMActivity");
	}
	else 
	{
		///
			alert("App Error");
	}
	

	
});


function ShowPhoto(PhotoRecID) {

	if (PhotoRecID && PhotoRecID > 0){		

	
	$('#tblIPMActivity').hide();
	$('#tblIPMActivityButtons').hide();

	$('#error-div-IPMActivity').text("").append(getLoadingMini());
	
		var _url = serviceRootUrl + "svc.aspx?op=GetIPMActivityPhoto&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + PhotoRecID ;
		Jsonp_Call(_url, false, "ShowPhotoDialog");
		

		
	}
	else
	{
		alert("App Error.");
	}
	
}


function ShowPhotoDialog(data)
{


	try {


				var catalog = data.d.results[0];

								
				$('<div>').simpledialog2({
					mode: 'blank',
					headerText: 'View Photo',
					headerClose: true,
					transition: 'flip',
					themeDialog: 'a',
					useModal: true,
					width: 300,
					zindex: 2000,
					blankContent : 
					  "<div style='padding: 15px;'><center><img width='95%' alt='' title='' border=0 src=data:image/jpg;base64," + catalog.Base64ImageBytes +"></center></div>"
				});
						
	$('#tblIPMActivity').show();
	$('#tblIPMActivityButtons').show();

	$('#error-div-IPMActivity').text("");
							

	}
	catch(err) {}
}





function callbackLoadIPMActivity(data)
{


	try {

//		if (data.d.results.length > 0)
//		{
			var temp = '<div class="ui-grid-b ui-responsive" id="IPMActivityGridSidePanel" name="IPMActivityGridSidePanel" style="padding-right:10px;">';

			for(var i=0; i < data.d.results.length; i++)
			{
				var IPMActivityChat="";
				var catalog = data.d.results[i];
				var HasPhoto = "";

				if (parseInt(catalog.HasPhoto) > 0)
					HasPhoto = '<br><span style="font-size:x-small;"><a title="" style="text-decoration:none;" href="#" onclick="ShowPhoto('+ catalog.HasPhoto  +')"><u>View Photo</u></a></span>';
				//var TableRow = $('<div style="margin: 0px 0px 0px 0px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span>'+HasPhoto+'</div>');

				var Username=catalog.CreatedBy;
//				if (isOdd(i))
				if(userInfoData.DisplayName.toUpperCase()!=Username.toUpperCase())
				{
					IPMActivityChat=IPMActivityChat+'<table style="width:100%;" class="ui-responsive ui-block-a"><tr><td style="padding-top:6px;vertical-align:top;">';
					if (catalog.Avatar.substring(0,7)=='<nopic>')
						{IPMActivityChat=IPMActivityChat+'<img style="padding:2px;" alt="" title="" border=0 width=50px height=50px src="Images/person.gif">';}
					else
						{IPMActivityChat=IPMActivityChat+'<img style="padding:2px;" alt="" title="" border=0 width=50px height=50px src=data:image/jpg;base64,'+catalog.Avatar+' />';}
					IPMActivityChat=IPMActivityChat+'<p style="font-size:x-small;color:silver;width: 50px;word-wrap: break-word;"><em>'+Username+' '+catalog.ActivityDate+'</em></p></td><td>';
					IPMActivityChat=IPMActivityChat+'<div  name="SpeechBubble" id="SpeechBubble"><div class="bubblel" id="viewport-content"><div><div style="font-size:small;">';
					IPMActivityChat=IPMActivityChat+ '<B>'+catalog.ActivityType +'</B><BR>'+ catalog.Comments + HasPhoto;
					IPMActivityChat=IPMActivityChat+'</div></div></div></div></td></tr></table>';
				}
				else
				{
				
					IPMActivityChat=IPMActivityChat+'<table style="width:100%;" class="ui-responsive ui-block-a"><tr><td>';
					IPMActivityChat=IPMActivityChat+'<div name="SpeechBubble" id="SpeechBubble"><div class="bubbler" id="viewport-content"><div><div style="font-size:small;">';
					IPMActivityChat=IPMActivityChat+ '<B>'+catalog.ActivityType +'</B><BR>'+ catalog.Comments + HasPhoto;
					IPMActivityChat=IPMActivityChat+'</div></div></div></div></td><td style="padding-top:6px;vertical-align:top;">';


					if (catalog.Avatar.substring(0,7)=='<nopic>')
						{IPMActivityChat=IPMActivityChat+'<img style="padding:2px;" alt="" title="" border=0 width=50px height=50px src="Images/person.gif">';}
					else
						{IPMActivityChat=IPMActivityChat+'<img style="padding:2px;" alt="" title="" border=0 width=50px height=50px src=data:image/jpg;base64,'+catalog.Avatar+' />';}
					IPMActivityChat=IPMActivityChat+'<p style="font-size:x-small;color:silver;width: 50px;word-wrap: break-word;"><em>'+Username+' '+catalog.ActivityDate+'</em></p></td>';
					IPMActivityChat=IPMActivityChat+'</tr></table>';





				}
				var TableRow = $(IPMActivityChat + ' ');

				
				TableRow.appendTo($("#IPMActivityGrid"));
				
				temp += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>';

			}
			
			temp += '</div>';
			$("#pnlProjectActivity-IPMActivity" ).html(temp);


			var id = $.urlParam("id");
			if (id > 0)
			{
			
				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectHeaderById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url2, false, "callbackLoadIPMActivitySidePanel");
			}


	}
	catch(err) {}
}


function callbackLoadIPMActivitySidePanel(data)
{



	try {

	
			if (data.d.results.length > 0)
			{

				var temp = "";
				
				var catalog = data.d.results[0];
				
					temp += '<table class="search-item" ><tr><td style="width:3px;">&nbsp;</td><td>';
					temp += '<div id="ProjectCard" class="panel-body" style="padding-bottom: 0px;padding-top: 30px;">';
					temp += ''
					temp += '<h2 style="color: silver; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6">';
					if (catalog.RoomNumber!='')
						temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.RoomNumber+'</h3>';		
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified + catalog.ModifiedByFullName +'</em></h6>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>IPM Update: ' + catalog.LastIPMUpdate + catalog.LastIPMUpdateBy +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';


				$("#pnlProjectDetails-IPMActivity" ).html(temp);


				$('#error-div2-IPMActivity').text("");
				$('#error-div-IPMActivity').text("");
					
				$('#tblIPMActivity').show();
				$('#tblIPMActivityButtons').show();
				
			}
		}
	catch(err) {}
}



function cancelStatusIPMActivity() {
	if ($("#txtComments").val()!=""){

		$('<div>').simpledialog2({
			mode: 'blank',
			headerText: 'Cancel',
			headerClose: false,
			transition: 'flip',
			themeDialog: 'a',
			zindex: 2000,
			blankContent : 
			  "<div style='padding: 15px;'><p>Cancel changes and go back to main screen?</p>"+
			  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"NavigatePage('#pgHome');\">OK</a></td>" + 
			  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
			  }); 
	}
	else
	{
		NavigatePage('#pgHome');
	}

}
function backStatusIPMActivity() {


	if ($("#txtComments").val() != ""){		
			$('<div>').simpledialog2({
				mode: 'blank',
				headerText: 'Back',
				headerClose: false,
				transition: 'flip',
				themeDialog: 'a',
				zindex: 2000,
				blankContent : 
				  "<div style='padding: 15px;'><p>Discard changes and go back to project options?</p>"+
				  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"GoToSectionWithID('ProjectOptions');\">OK</a></td>" + 
				  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
			  }); 
	}
	else
	{
		GoToSectionWithID('ProjectOptions');
	}
}



function saveIPMActivity(isFinal) {

	if ($("#txtComments").val() != ""){		

		$scope = {
			recordId : $.urlParam("id"),
			ddlActivityType : $("#ddlActivityType").val(),
			txtComments : $("#txtComments").val(),		
			txtActivityDate : $("#txtActivityDate").val()

		};

		
		var	confirmMessage="";
		confirmMessage=confirmMessage + "Add activity and go back to project options?";

		
//		$('#error-div-IPMActivity').text("");
//		$('#tblIPMActivity').show();
//		$('#tblIPMActivitysButtons').show();	



		$('<div>').simpledialog2({
			mode: 'blank',
			headerText: 'Add activity',
			headerClose: false,
			transition: 'flip',
			themeDialog: 'a',
			width: 300,
			zindex: 2000,
			blankContent : 
			  "<div style='padding: 15px;'><p>" + confirmMessage + "</p>"+
			  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"SaveIPMActivityProcess('" + isFinal + "');\">OK</a></td>" + 
			  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
		});
		
	}
	else
	{
		if (isFinal=="CAM")
		{
				$scope = {
					recordId : $.urlParam("id"),
					ddlActivityType : $("#ddlActivityType").val(),
					txtComments : "(Photo Uploaded)",		
					txtActivityDate : $("#txtActivityDate").val()

				};

				var	confirmMessage="";
				confirmMessage=confirmMessage + "Add activity and go back to project options?";


				$('<div>').simpledialog2({
					mode: 'blank',
					headerText: 'Add activity',
					headerClose: false,
					transition: 'flip',
					themeDialog: 'a',
					width: 300,
					zindex: 2000,
					blankContent : 
					  "<div style='padding: 15px;'><p>" + confirmMessage + "</p>"+
					  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"SaveIPMActivityProcess('" + isFinal + "');\">OK</a></td>" + 
					  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
				});		
		}
		else
		{
			alert("Please enter some comments.");
		}
	}
	
}



	
function SaveIPMActivityProcess(isFinal)
{
	if ($scope) {
		
		//show saving animation
		$('#error-div-IPMActivity').text("").append(getLoadingMini());
		showTimedElem('error-div-IPMActivity');
		
		$('#tblIPMActivity').hide();
		$('#tblIPMActivitysButtons').hide();
	
		if ($scope.recordId != "" && parseInt($scope.recordId) > 0)
		{
			//showLoading(true);
			var _url =  serviceRootUrl + "svc.aspx?op=AddIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&recordId=" + $scope.recordId + "&ActivityTypeID=" + $scope.ddlActivityType + "&Comments=" + $scope.txtComments + "&ActivityDate=" + $scope.txtActivityDate + "&username=" + userInfoData.Email + "&userid=" + userInfoData.UserID + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
			
			console.log(_url);
			
			Jsonp_Call(_url, true, "callbackSaveIPMActivity");
		}


		
	}
}





function callbackSaveIPMActivity(data)
{
	try {

			$('#error-div2-IPMActivity').text("");
			$('#error-div-IPMActivity').text("");
			GoToSectionWithID('ProjectOptions');

	}
	catch(err) { }
}

/******************* Edit Construction ***********************/
$( document ).on( "pagebeforeshow", "#pgConstruction", function(event) {
	checkUserLogin();
	
	
	
	$('#tblConstruction').hide();
	$('#tblConstructionsButtons').hide();

	$('#error-div').text("").append(getLoadingMini());
	
	$("#tblConstruction").find("input").each(function() {
		if ($(this).attr("type") == "text" || $(this).attr("type") == "date")
			$(this).val("");
		if ($(this).attr("type") == "radio")
			$(this).prop('checked', false);
	});	
	$("#tblConstruction").find("input[type=radio]").checkboxradio("refresh");
	$("#ddlSR_Government_Agencies").val('None').selectmenu('refresh', true);
	
	
	
	var id = $.urlParam("id");
	if (id > 0)
	{
	
		var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
		Jsonp_Call(_url2, false, "callbackLoadProjectDetail");
	}
	else 
	{
		///
			alert("App Error");
	}
	

	
});

function goHomeAfterConfirm(FromPage)
{
	if (FromPage=='Construction')
	{
	
		$('<div>').simpledialog2({
		mode: 'blank',
		headerText: 'Go Home',
		headerClose: false,
		transition: 'flip',
		themeDialog: 'a',
		zindex: 2000,
		blankContent : 
		  "<div style='padding: 15px;'><p>Discard changes and go back to home screen?</p>"+
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"goHome();\">OK</a></td>" + 
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    }); 
	
	}

}

function callbackLoadSidePanel(data)
{



	try {
				
				
				
		//if (data.d.results.length > 0)
		//{
			var temp = '<div class="ui-grid-b ui-responsive" id="ActivityGridSidePanel" name="ActivityGridSidePanel" style="padding-right:10px;">';
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				var TableRow = $('<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>');
				TableRow.appendTo($("#IPMActivityGrid"));
				
				temp += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>';

			}
			
			temp += '</div>';
			$("#pnlProjectActivity" ).html(temp);
	

				$('#error-div2').text("");
				$('#error-div').text("");
					
				$('#tblConstruction').show();
				$('#tblConstructionsButtons').show();
				
			}
		//}
	catch(err) {}
}

function callbackLoadProjectDetail(data)
{



	try {
	$("#tblConstruction").find("input").each(function() {
		if ($(this).attr("type") == "date")
		{
				$(this).css({'background-color' : 'white'});
				$(this).removeAttr('disabled');

				}
	});	
	$("#tblConstruction").find("input[type=radio]").checkboxradio("refresh");
	$("#ddlSR_Government_Agencies").val('None').selectmenu('refresh', true);
	


	
		if (data.d.results.length > 0)
		{
			var catalog = data.d.results[0];
						


			$("#hdnExpectedBillDate").val(catalog.ExpectedBillDate);
			$("#hdnBookStatus").val(catalog.BookStatus);

			if (catalog.ConstructionProgress){
				SetRadioValue('SR_Construction_Progress', catalog.ConstructionProgress);}
			SetRadioValue('rbIP_Installation_Status', catalog.IPMStatus);
			SetRadioValue('SR_Required', catalog.ConstructionRequired);

			
			$("#ddlSR_Government_Agencies").val(catalog.GovernmentAgencies).selectmenu('refresh', true);
			SetRadioValue('SR_Contractor_Selected', catalog.ContractorSelected);
			$("#txtSR_Contractor_Selected_Date").val(getISODateString(catalog.ContractorSelectedDate));
			if (catalog.ContractorSelected=="YES")
			{
				$("#txtSR_Contractor_Selected_Date").removeAttr('disabled');
				$("#txtSR_Contractor_Selected_Date").css({'background-color' : 'white'});
			}
			else
			{
				$("#txtSR_Contractor_Selected_Date").attr('disabled', 'disabled');
				$("#txtSR_Contractor_Selected_Date").css({'background-color' : 'lightgray'});
			}
			
			SetRadioValue('SR_PreConstruction_Meeting_Scheduled', catalog.PreConstructionMeetingScheduled);
			$("#txtSR_PreConstruction_Meeting_Scheduled_Date").val(getISODateString(catalog.PreConstructionMeetingScheduledDate));
			if (catalog.PreConstructionMeetingScheduled=="YES")
			{
				$("#txtSR_PreConstruction_Meeting_Scheduled_Date").removeAttr('disabled');
				$("#txtSR_PreConstruction_Meeting_Scheduled_Date").css({'background-color' : 'white'});
			}
			else
			{
				$("#txtSR_PreConstruction_Meeting_Scheduled_Date").attr('disabled', 'disabled');
				$("#txtSR_PreConstruction_Meeting_Scheduled_Date").css({'background-color' : 'lightgray'});
			}
					
			$("#txtSR_Construction_Weeks").val(catalog.ConstructionWeeks);
			
			SetRadioValue('SR_Final_Drawing_Reviewed', catalog.FinalDrawingsReviewedByCustomer);
			$("#txtSR_Final_Drawings_Reviewed_Date").val(getISODateString(catalog.FinalDrawingsReviewedByCustomerDate));
			if (catalog.FinalDrawingsReviewedByCustomer=="YES")
			{
				$("#txtSR_Final_Drawings_Reviewed_Date").removeAttr('disabled');
				$("#txtSR_Final_Drawings_Reviewed_Date").css({'background-color' : 'white'});
			}
			else
			{
				$("#txtSR_Final_Drawings_Reviewed_Date").attr('disabled', 'disabled');
				$("#txtSR_Final_Drawings_Reviewed_Date").css({'background-color' : 'lightgray'});
			}
					
			SetRadioValue('rbSR_Drawing_Approved', catalog.ConstructionDrawingsApproved);
			SetRadioValue('SR_Building_Permit_Approved', catalog.BuildingPermitApproved);

			SetRadioValue('SR_Timeline_Published', catalog.ConstructionTimelinePublished);
			$("#txtSR_Timeline_Published_Date").val(getISODateString(catalog.ConstructionTimelinePublishedDate));
			if (catalog.ConstructionTimelinePublished=="YES")
			{
				$("#txtSR_Timeline_Published_Date").removeAttr('disabled');
				$("#txtSR_Timeline_Published_Date").css({'background-color' : 'white'});
			}
			else
			{
				$("#txtSR_Timeline_Published_Date").attr('disabled', 'disabled');
				$("#txtSR_Timeline_Published_Date").css({'background-color' : 'lightgray'});
			}
				
				
			$("#txtSR_Forecasted_Site_Ready_Date").val(getISODateString(catalog.ForecastedSiteReadyDate));

			
			if (parseInt(catalog.OverrideConfidenceLevel) == 1 || catalog.OverrideConfidenceLevel || parseInt(catalog.Confidence) >= ConfidenceLevel)
			{
				$("#txtSR_Forecasted_Site_Ready_Date").removeAttr('disabled');
				$("#txtSR_Forecasted_Site_Ready_Date").css({'background-color' : 'white'});
			}
			else
			{
				$("#txtSR_Forecasted_Site_Ready_Date").attr('disabled', 'disabled');
				$("#txtSR_Forecasted_Site_Ready_Date").css({'background-color' : 'lightgray'});
			}

								
			
			$("#txtSR_Riggers_Date").val(getISODateString(catalog.RiggersDate));
			SetRadioValue('SR_Installation_Kit', catalog.PreShipmentOfInstallationKitEpoxyKit);

			SetRadioValue('SR_Electronic_Checked', catalog.Electronic);
			$("#txtSR_Electronic_Date").val(getISODateString(catalog.ElectronicDate));
			if (catalog.Electronic=="YES")
			{
				$("#txtSR_Electronic_Date").removeAttr('disabled');
				$("#txtSR_Electronic_Date").css({'background-color' : 'white'});
			}
			else
			{
				$("#txtSR_Electronic_Date").attr('disabled', 'disabled');
				$("#txtSR_Electronic_Date").css({'background-color' : 'lightgray'});
			}
						
			
			SetRadioValue('SR_Pre_Installation_Checked', catalog.PreInstallation);
			$("#txtSR_Pre_Installation_Date").val(getISODateString(catalog.PreInstallationDate));
			if (catalog.PreInstallation=="YES")
			{
				$("#txtSR_Pre_Installation_Date").removeAttr('disabled');
				$("#txtSR_Pre_Installation_Date").css({'background-color' : 'white'});
			}
			else
			{
				$("#txtSR_Pre_Installation_Date").attr('disabled', 'disabled');
				$("#txtSR_Pre_Installation_Date").css({'background-color' : 'lightgray'});
			}
			if (catalog.OpportunityModality == "MR")
			{

				$('#MRSpecific1').show();
				$('#MRSpecific2').show();
				$('#MRSpecific3').show();
				$('#MRSpecific4').show();
				$('#MRSpecific5').show();
			}

				var temp = "";
				

				
					temp += '<table class="search-item" ><tr><td style="width:3px;">&nbsp;</td><td>';
					temp += '<div id="ProjectCard" class="panel-body" style="padding-bottom: 0px;padding-top: 30px;">';
					temp += ''
					temp += '<h2 style="color: silver; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6">';
					if (catalog.RoomNumber!='')
						temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.RoomNumber+'</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">' + catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified + catalog.ModifiedByFullName +'</em></h6>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>IPM Update: ' + catalog.LastIPMUpdate + catalog.LastIPMUpdateBy +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';

				$("#pnlProjectDetails" ).html(temp);






				var id = $.urlParam("id");
				if (id > 0)
				{
					var _url2 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
					Jsonp_Call(_url2, false, "callbackLoadSidePanel");				
				}
				else 
				{
					///
						alert("App Error");
				}				






			}
		else
		{
			//
		}
	}
	catch(err) {}
}


function cancelStatus() {
	$('<div>').simpledialog2({
		mode: 'blank',
		headerText: 'Cancel',
		headerClose: false,
		transition: 'flip',
		themeDialog: 'a',
		zindex: 2000,
		blankContent : 
		  "<div style='padding: 15px;'><p>Cancel changes and go back to main screen?</p>"+
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"NavigatePage('#pgHome');\">OK</a></td>" + 
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    }); 
}
function backStatus() {
		
	$('<div>').simpledialog2({
		mode: 'blank',
		headerText: 'Back',
		headerClose: false,
		transition: 'flip',
		themeDialog: 'a',
		zindex: 2000,
		blankContent : 
		  "<div style='padding: 15px;'><p>Discard changes and go back to project options?</p>"+
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"GoToSectionWithID('ProjectOptions');\">OK</a></td>" + 
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    }); 
}




function saveStatus(isFinal) {


var result = 0;


            //If Complete	 	        30
            //If on Track contingent 	10
            //If Risk 			        0
            //If non booked 		    0 
			
			if ($("#hdnExpectedBillDate").val())
			{

				
				switch ($("#hdnExpectedBillDate").val().toUpperCase())
				{
					case "APPROVED":
						result = result + 30;
						break;
					case "CONTINGENT":
						break;
					case "C":
						result = result + 10;
						break;
					case "UNAPPROVED":
						break;
					case "FORECASTED":
						break;
					case "":
						break;
					default:
						break;
				}
			}
            //Final Drawings 		15
            if ($('input[name=SR_Final_Drawing_Reviewed]:checked').val())
            {
				if ($('input[name=SR_Final_Drawing_Reviewed]:checked').val() == "YES")
				{
					result = result + 15;
				}
			}
            //Local permits   		10
			if ($('input[name=SR_Building_Permit_Approved]:checked').val())
            {
				if ($('input[name=SR_Building_Permit_Approved]:checked').val() == "YES")
				{
					result = result + 10;
				}
			}

            //Construcion timeline            	15
            if ($('input[name=SR_Timeline_Published]:checked').val())
            {
				if ($('input[name=SR_Timeline_Published]:checked').val() == "YES")
				{
					result = result + 15;
				}
			}
            //Construction Complete 	20
            //on Track contingent 		10
            //If Risk 			       -20
            switch ($('input[name=SR_Construction_Progress]:checked').val())
            {
                case "COMPLETE":
                    result = result + 20;
                    break;
                case "ON TARGET":
                    result = result + 10;
                    break;
                case "RISK":
                    result = result + 20;
                    break;
                default:
                    result = result + 0;
                    break;

            }

            //Rigger or SRD 		 10 
            //IPM will be able to enter SRD at any time. 
            // If riggers date is entered that will take precedence.
            if ($("#txtSR_Riggers_Date").val())
            {
                result = result + 10;
            }
            else if ($("#txtSR_Forecasted_Site_Ready_Date").val())
            {
                result = result + 10;
            }

            //it will never be 100, as one check is missing, as we don't know what compelling event is
            //Compeling event = 10

			



	$scope = {
		recordId : $.urlParam("id"),
		ddlSR_Government_Agencies : $("#ddlSR_Government_Agencies").val(),
		SR_Construction_Progress : $('input[name=SR_Construction_Progress]:checked').val(),
		txtSR_Construction_Weeks : $("#txtSR_Construction_Weeks").val(),		
		txtSR_Contractor_Selected_Date : $("#txtSR_Contractor_Selected_Date").val(),
		
		rbIP_Installation_Status : $('input[name=rbIP_Installation_Status]:checked').val(),
		SR_Required : $('input[name=SR_Required]:checked').val(),
		SR_Contractor_Selected : $('input[name=SR_Contractor_Selected]:checked').val(),
		SR_PreConstruction_Meeting_Scheduled : $('input[name=SR_PreConstruction_Meeting_Scheduled]:checked').val(),
		SR_Final_Drawing_Reviewed : $('input[name=SR_Final_Drawing_Reviewed]:checked').val(),
		txtSR_PreConstruction_Meeting_Scheduled_Date : $("#txtSR_PreConstruction_Meeting_Scheduled_Date").val(),
		txtSR_Final_Drawings_Reviewed_Date : $("#txtSR_Final_Drawings_Reviewed_Date").val(),
		rbSR_Drawing_Approved : $('input[name=rbSR_Drawing_Approved]:checked').val(),
		SR_Building_Permit_Approved : $('input[name=SR_Building_Permit_Approved]:checked').val(),
		SR_Installation_Kit : $('input[name=SR_Installation_Kit]:checked').val(),
		SR_Electronic_Checked : $('input[name=SR_Electronic_Checked]:checked').val(),
		SR_Timeline_Published : $('input[name=SR_Timeline_Published]:checked').val(),
		txtSR_Timeline_Published_Date : $("#txtSR_Timeline_Published_Date").val(),
		txtSR_Electronic_Date : $("#txtSR_Electronic_Date").val(),
		txtSR_Pre_Installation_Date : $("#txtSR_Pre_Installation_Date").val(),
		txtSR_Forecasted_Site_Ready_Date : $("#txtSR_Forecasted_Site_Ready_Date").val(),
		txtSR_Riggers_Date : $("#txtSR_Riggers_Date").val(),
		ExpectedBillDate : $("#hdnExpectedBillDate").val(),
		BookStatus : $("#hdnBookStatus").val(),
		Confidence : result,
		StatusId : $("#divStatusId").text()
		
		

	};

	


	var	confirmMessage="";
	
	if ($scope.ExpectedBillDate) 
	{
		var then = new Date($scope.ExpectedBillDate), now = new Date;
		var NumberOfDays=Math.round((then - now) / (1000 * 60 * 60 * 24));
	
		if ($scope.txtSR_Forecasted_Site_Ready_Date!="" && NumberOfDays < 90){
			/*$('#error-div').html('The Bill Date is within 90 days, please enter Site Ready Date');
			showTimedElem('error-div');
			$('#error-div2').html('The Bill Date is within 90 days, please enter Site Ready Date');
			showTimedElem('error-div2');
			*/
			confirmMessage="The Bill Date is within 90 days, it is advised to enter Site Ready Date<br><br>";
			//showLoading(false);
			//return;
		}
	}
	
	
	
	confirmMessage=confirmMessage + "Save changes and go back to project options?";
	$('<div>').simpledialog2({
		mode: 'blank',
		headerText: 'Save Changes',
		headerClose: false,
		transition: 'flip',
		themeDialog: 'a',
		width: 300,
		zindex: 2000,
		blankContent : 
		  "<div style='padding: 15px;'><p>" + confirmMessage + "</p>"+
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"SaveStatusProcess('" + isFinal + "');\">OK</a></td>" + 
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    });
	

	
	
}



	
function SaveStatusProcess(isFinal)
{
	
	if ($scope) {
		
		//show saving animation
		$('#error-div').text("").append(getLoadingMini());
		showTimedElem('error-div');
		
		$('#tblConstruction').hide();
		$('#tblConstructionsButtons').hide();

		if ($scope.recordId != "" && parseInt($scope.recordId) > 0)
		{
			//showLoading(true);
			var _url =  serviceRootUrl + "svc.aspx?op=SaveProject&SPUrl=" + spwebRootUrl + "sites/busops&recordId=" + $scope.recordId + "&GovernmentAgencies=" + $scope.ddlSR_Government_Agencies + "&ConstructionProgress=" + $scope.SR_Construction_Progress + "&ConstructionWeeks=" + $scope.txtSR_Construction_Weeks + "&ContractorSelectedDate=" + $scope.txtSR_Contractor_Selected_Date + "&IPMStatus=" + $scope.rbIP_Installation_Status + "&ConstructionRequired=" + $scope.SR_Required + "&ContractorSelected=" + $scope.SR_Contractor_Selected + "&PreConstructionMeetingScheduled=" + $scope.SR_PreConstruction_Meeting_Scheduled + "&FinalDrawingsReviewedByCustomer=" + $scope.SR_Final_Drawing_Reviewed + "&PreConstructionMeetingScheduledDate=" + $scope.txtSR_PreConstruction_Meeting_Scheduled_Date + "&FinalDrawingsReviewedByCustomerDate=" + $scope.txtSR_Final_Drawings_Reviewed_Date + "&ConstructionDrawingsApproved=" + $scope.rbSR_Drawing_Approved + "&BuildingPermitApproved=" + $scope.SR_Building_Permit_Approved + "&PreShipmentOfInstallationKitEpoxyKit=" + $scope.SR_Installation_Kit + "&Electronic=" + $scope.SR_Electronic_Checked + "&ConstructionTimelinePublished=" + $scope.SR_Timeline_Published + "&ElectronicDate=" + $scope.txtSR_Electronic_Date + "&PreInstallationDate=" + $scope.txtSR_Pre_Installation_Date + "&ForecastedSiteReadyDate=" + $scope.txtSR_Forecasted_Site_Ready_Date + "&RiggersDate=" + $scope.txtSR_Riggers_Date+ "&Confidence=" + $scope.Confidence + "&ConstructionTimelinePublishedDate=" + $scope.txtSR_Timeline_Published_Date
			+ "&username=" + userInfoData.Email + "&userid=" + userInfoData.UserID + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
			
			console.log(_url);
			
			Jsonp_Call(_url, true, "callbackSaveStatus");
		}


		
	}
}





function callbackSaveStatus(data)
{
	try {

			$('#error-div2').text("");
			$('#error-div').text("");
			GoToSectionWithID('ProjectOptions');

	}
	catch(err) { }
}

/******************* Redirect Page ***********************/
$( document ).on( "pagebeforeshow", "#pgRedirect", function(event) {
	if ($.urlParamRedirect("url"))
	{
		NavigatePageNoSlide(decodeURIComponent($.urlParamRedirect("url")));
	}
});

var Jsonp_Call_Count = 0;
function Jsonp_Call(_url, _async, callback)
{
	try {
		Jsonp_Call_Count = 0;		
		setTimeout(function(){
			Jsonp_Call_Count++;
			Jsonp_Call_RecursiveCall(_url, _async, callback);
		}, 1000);
	}
	catch (err) {}	
}

function Jsonp_Call_RecursiveCall(_url, _async, callback)
{
	if (userLongitude != 0 || userLongitude != 0 || Jsonp_Call_Count >= 5)
	{
		Jsonp_Call_Process(_url, _async, callback)
	}
	else
	{
		setTimeout(function(){
			Jsonp_Call_Count++;
			Jsonp_Call_RecursiveCall(_url, _async, callback);
		}, 1000);
	}
}

function Jsonp_Call_Process(_url, _async, callback)
{
	try {	
		$.ajax({
				crossDomain: true,
				type:"GET",
				contentType: "application/javascript",
				async:_async,
				cache: false,
				url: _url + "&nocachets=" + (new Date().getTime()) + "&deviceInfo=" + _encodeURIComponent(deviceInfo) + "&lon=" + userLongitude + "&lat=" + userLatitude,
				data: {},
				dataType: "jsonp",                
				jsonpCallback: callback,
				error: function(jqXHR, textStatus, errorThrown) {
					if (textStatus.toLowerCase() == "error")
					{
						$("img[src='Images/loading.gif']").each(function () {
							$(this).parent().prepend("<div class='network-unreachable' style='color: red;'>Network unreachable</div>");
							$(this).remove();
						});
						$("img[src='Images/ajax-loader.gif']").each(function () {
							$(this).parent().prepend("<div class='network-unreachable' style='color: red;'>Network unreachable</div>");
							$(this).remove();
						});
						$("img[src='Images/ajax-loader-min.gif']").each(function () {
							$(this).parent().prepend("<div class='network-unreachable' style='color: red;'>Network unreachable</div>");
							$(this).remove();
						});
					}
				}
		});
	}
	catch(err) { }
}

function SignOut()
{
	var _url = serviceRootUrl + "svc.aspx?op=LogOut&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader;
	Jsonp_Call(_url, false, "");

	userInfoData = localstorage.clear("userInfoData");
	isUserLogin = false;
	
	NavigatePage("#pgLogin");
}

function checkUserLogin()
{
	$(".network-unreachable").remove();

	checkConnection();
	if (userInfoData == null)
	{
		if (localstorage.get("userInfoData") != null)
		{
			userInfoData = localstorage.get("userInfoData");
		}
		else if (localstorage.get("userInfoData") == null)
		{
			userInfoData = localstorage.getUserInfoDefault();
		}
	}
	
	isUserLogin = (userInfoData.AuthenticationHeader != null && userInfoData.AuthenticationHeader != "" && 
					userInfoData.DisplayName != null && userInfoData.DisplayName != "" &&
					userInfoData.Email != null && userInfoData.Email != "" && userInfoData.Expiration > getTimestamp());


    if (!isUserLogin && location.href.indexOf("#pgLogin") < 0)
	{
		NavigatePage("#pgLogin");
	}
	else if (isUserLogin)
	{	
		$(".spanLoginUser").text("" +userInfoData.DisplayName);
		if (location.href.indexOf("#") < 0 || location.href.indexOf("#pgLogin") > 0)
			NavigatePage("#pgHome");
	}
}

function checkConnection() {
	try {
		var networkState = navigator.connection.type;
		var states = {};
		states[Connection.UNKNOWN]  = 'Unknown connection';
		states[Connection.ETHERNET] = 'Ethernet connection';
		states[Connection.WIFI]     = 'WiFi connection';
		states[Connection.CELL_2G]  = 'Cell 2G connection';
		states[Connection.CELL_3G]  = 'Cell 3G connection';
		states[Connection.CELL_4G]  = 'Cell 4G connection';
		states[Connection.CELL]     = 'Cell generic connection';
		states[Connection.NONE]     = 'It looks like you\'ve lost your connection. Please check that you have a working connection and try again.';
		
		$(".no-connection-warning").remove();
			
		if (networkState == Connection.NONE)
		{
			$('div[role="main"]').prepend( "<div class='no-connection-warning'>" + states[networkState] + "</div>" );
		}
	}
	catch (err) {
		$(".no-connection-warning").remove();
	}
	
	
}

function GetpnlSideShow()
{
				var RetVal='<div class="ui-grid-b ui-responsive" id="EquipmentListGridSidePanel" name="EquipmentListGridSidePanel" style="padding-right:10px;">';
				RetVal += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">Architecture, Design, Coding by UMER PASHA</span><br><span style="font-size:x-small;">www.umerpasha.com</span></div>';	
				return RetVal;
}



var VideoCaptureSuccess = function(mediaFiles) {
    var i, path, len;
    for (i = 0, len = mediaFiles.length; i < len; i += 1) {
        path = mediaFiles[i].fullPath;
		uploadVideo(path);
    }
};


function ShootVideo() {  

       navigator.device.capture.captureVideo(VideoCaptureSuccess, function(message) { alert('No Video'); }, {limit: 1,duration: 60});

     }  
	 



	 
	 
function SnapPhoto() {  

       navigator.camera.getPicture(  
         uploadPhoto,  
         function(message) { alert('No picture taken'); },  
         {  
           quality     : 50,  
           destinationType : navigator.camera.DestinationType.FILE_URI,  
           sourceType   : navigator.camera.PictureSourceType.CAMERA,
		   encodingType: navigator.camera.EncodingType.JPEG,
		   targetWidth: 640,
		   targetHeight: 480
         }  
       );  
     }  
function SelectPhoto() {  
       navigator.camera.getPicture(  
         uploadPhoto,  
         function(message) { alert('No photo selected'); },  
         {  
           quality     : 50,  
           destinationType : navigator.camera.DestinationType.FILE_URI,  
           sourceType   : navigator.camera.PictureSourceType.PHOTOLIBRARY,  
		   encodingType: navigator.camera.EncodingType.JPEG,
		   targetWidth: 640,
		   targetHeight: 480
         }  
       );  
     }  
	 
	 
	 function SelectMultiPhoto() {  

	 
	 
			window.imagePicker.getPictures(
			
			function(message) {
				for (var i = 0; i < message.length; i++) {
					//alert('Image URI: ' + message[i]);
					uploadPhoto(message[i]);
				}
			}, function (error) {
				alert('No photo selected');
			}, {
				quality     : 50, 
				maximumImagesCount: 5,
				width: 640,
				height:480

			}
		);	 
	 
	 
	 
     }  
	 

	 
 function uploadVideo(imageURI) {  

   var options = new FileUploadOptions();  
   

   
	var ddlActivityType = $("#ddlActivityType").val();
	var txtComments = $("#txtComments").val();
	var txtActivityDate = $("#txtActivityDate").val();
	var SPURL=spwebRootUrl + "sites/busops";
	if (!txtComments || txtComments=="" )
		txtComments = "(Photo Uploaded)";


   options.fileKey="file";  

   options.fileName= imageURI.substr(imageURI.lastIndexOf('/')+1);  

   
   options.mimeType="video/mp4";  

   var params = {};  
   params.ProjectID = $.urlParam("id");  
   params.ProjectActivityID = "0";  
   params.CreatedBy = userInfoData.UserID ;  
   params.ActivityType = ddlActivityType;  
   params.Comments = txtComments;  
   params.ActivityDate = txtActivityDate ;  
   params.SPURL = SPURL ;  
   params.UserName = userInfoData.Email ;  
   params.authInfo = userInfoData.AuthenticationHeader ;  
   options.params = params;  
   var ft = new FileTransfer();  
   var _url =  serviceRootUrl + "svc.aspx?op=UploadFile";

   ft.upload(imageURI, encodeURI(_url), snapwin, snapfail, options); 
		console.log(_url);

   
 }  
	 
	 
 function uploadPhoto(imageURI) {  

   var options = new FileUploadOptions();  
   
   
	var ddlActivityType = $("#ddlActivityType").val();
	var txtComments = $("#txtComments").val();
	var txtActivityDate = $("#txtActivityDate").val();
	var SPURL=spwebRootUrl + "sites/busops";
	if (!txtComments || txtComments=="" )
		txtComments = "(Photo Uploaded)";

	

   options.fileKey="file";  
   options.fileName="c:\\logs\\MobileImages\\" + imageURI.substr(imageURI.lastIndexOf('/')+1);  
   options.mimeType="image/jpeg";  
   var params = {};  
   params.ProjectID = $.urlParam("id");  
   params.ProjectActivityID = "0";  
   params.CreatedBy = userInfoData.UserID ;  
   params.ActivityType = ddlActivityType;  
   params.Comments = txtComments;  
   params.ActivityDate = txtActivityDate ;  
   params.SPURL = SPURL ;  
   params.UserName = userInfoData.Email ;  
   params.authInfo = userInfoData.AuthenticationHeader ;  
   options.params = params;  
   var ft = new FileTransfer();  
   var _url =  serviceRootUrl + "svc.aspx?op=UploadFile";

//		$('#error-div-IPMActivity').text("").append(getLoadingMini());
//		showTimedElem('error-div-IPMActivity');
//		$('#tblIPMActivity').hide();
//	$('#tblIPMActivitysButtons').hide();	
   
   ft.upload(imageURI, encodeURI(_url), snapwin, snapfail, options); 
		console.log(_url);
		
//			Jsonp_Call(_url, true, "callbackSaveStatus");
   
   
   
 }  
 
 
 
 
 
 
 
 
 
 
 
     function snapwin(r) {  
 			$('#error-div2-IPMActivity').text("");
			$('#error-div-IPMActivity').text("");
			GoToSectionWithID('ProjectOptions');
	 
		//saveIPMActivity('CAM');
     }  
     function snapfail(error) {  
       alert("An error has occurred sending photo: Code = " + error.code);  
		$('#error-div2-IPMActivity').text("");
		$('#error-div-IPMActivity').text("");
		GoToSectionWithID('ProjectOptions');

     }  
	 
     function GetCoordinates(Direction) {  
	 
		navigator.geolocation.getCurrentPosition(function (position) {
		

		
				if (Direction=='Front'){
					window.localStorage.setItem("RDFrontLat", position.coords.latitude);
					window.localStorage.setItem("RDFrontLon", position.coords.longitude);
				}
				else if (Direction=='Back'){
					window.localStorage.setItem("RDBackLat", position.coords.latitude);
					window.localStorage.setItem("RDBackLon", position.coords.longitude);
				}
				else if (Direction=='Left'){
					window.localStorage.setItem("RDLeftLat", position.coords.latitude);
					window.localStorage.setItem("RDLeftLon", position.coords.longitude);
				}
				else if (Direction=='Right'){
					window.localStorage.setItem("RDRightLat", position.coords.latitude);
					window.localStorage.setItem("RDRightLon", position.coords.longitude);
				}
				
				var Dimensions=CalcRoom();
				//CalcRoom();
		
		
		
		} , onErrorGetCoordinates);

     }  
	 

	 function onErrorGetCoordinates(error) {
        alert('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
    }
	 
	 function CalcRoom(){
	 				

	 		if (
				window.localStorage.getItem("RDFrontLat") === '0' || window.localStorage.getItem("RDFrontLon") === '0' ||
				window.localStorage.getItem("RDBackLat") === '0' || window.localStorage.getItem("RDBackLon") === '0' ||
				window.localStorage.getItem("RDLeftLat") === '0' || window.localStorage.getItem("RDLeftLon") === '0' ||
				window.localStorage.getItem("RDRightLat") === '0' || window.localStorage.getItem("RDRightLon") === '0' 
				)
					{return 0;}
			else{
					var RDFrontLat=window.localStorage.getItem("RDFrontLat");
					var RDFrontLon=window.localStorage.getItem("RDFrontLon");
					var RDBackLat=window.localStorage.getItem("RDBackLat");
					var RDBackLon=window.localStorage.getItem("RDBackLon");
					var RDLeftLat=window.localStorage.getItem("RDLeftLat");
					var RDLeftLon=window.localStorage.getItem("RDLeftLon");
					var RDRightLat=window.localStorage.getItem("RDRightLat");
					var RDRightLon=window.localStorage.getItem("RDRightLon");
			
			
					var BackWall = DegreesToMeters(RDBackLat,RDLeftLon,RDBackLat,RDRightLon);
					var FrontWall = DegreesToMeters(RDFrontLat,RDLeftLon,RDFrontLat,RDRightLon);
					var LeftWall = DegreesToMeters(RDBackLat,RDLeftLon,RDFrontLat,RDLeftLon);
					var RightWall = DegreesToMeters(RDBackLat,RDRightLon,RDFrontLat,RDRightLon);
			
			
									alert(
									'BackWall:'+BackWall + '\n' +
									'FrontWall:'+FrontWall + '\n' +
									'LeftWall:'+LeftWall + '\n' +
									'RightWall:'+RightWall 
									);
				}
				return 0;
	 }
	 
	function DegreesToMeters(lat1,lon1,lat2,lon2){

		var R = 6371; // km
		var dLat = toRad(lat2-lat1);
		var dLon = toRad(lon2-lon1); 
	
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *  Math.sin(dLon/2) * Math.sin(dLon/2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 

		var d = R * c;
		d=d*1000; //KMs to Meters

		return d;
	}
	function toRad(Value) {
		/** Converts numeric degrees to radians */
			return (Value * Math.PI / 180);

	}
	 
	 