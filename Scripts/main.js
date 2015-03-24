var serviceRootUrl = Configs.ServiceRootUrl;
var spwebRootUrl = Configs.SharePointRootUrl;

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
	initSystemTypes();
	LoadSystemTypes();
	
	isPageLoadReady = true;
	
};

  //reset type=date inputs to text
  $( document ).bind( "mobileinit", function(){
    $.mobile.page.prototype.options.degradeInputs.date = true;
  });	



$( document ).on( "pagebeforeshow", "#pgHome", function(event) {
	checkUserLogin();

	var _url = serviceRootUrl + "svc.aspx?op=LogHomePage&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.Email;
	Jsonp_Call(_url, false, "");	
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
	$('.ui-content').on('click', '.ui-input-clear', function(e){
		performSearch();
	});
	
	$( "#searchCatalogs" ).keypress(function(e) {
		if (e.keyCode == 13) {
            performSearch();
        }
	});
	
	$("#userSearchSortBy").bind( "change", function(event, ui) {
		performSearch();
	});

	
	searchAction();
});


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


function initSystemTypes()
{
	//Load System Types from localstorage
	var localSystemTypes = localstorage.get("localSystemTypes");
	if (localSystemTypes != null && localSystemTypes != "")
	{
		$('#filterDocumentType option[value!="All"]').remove();			
		var _localSystemTypes = localSystemTypes.split(";");
		for (var i = 0; i < _localSystemTypes.length; i++)
		{
			if (_localSystemTypes[i] != "")
				$("#filterDocumentType").append("<option value='" + _localSystemTypes[i] + "' "+ ((userSearchSystemType == $.trim(_localSystemTypes[i])) ? "selected" : "") +">" + _localSystemTypes[i] + "</option>");
		}
		
		try {
			$('#filterDocumentType').selectmenu("refresh");
		} catch (err) {}
	}
}

function LoadSystemTypes()
{
	var _url = serviceRootUrl + "svc.aspx?op=GetSystemTypes&SPUrl=" + spwebRootUrl + "sites/busops";
	//Jsonp_Call(_url, true, "callbackPopulateSystemTypes");	
}

function callbackPopulateSystemTypes(data)
{
	try {
		if (data.d.results.length > 0)
		{
			$('#filterDocumentType option[value!="All"]').remove();
			
			var localSystemTypes = "";
			for (var i = 0; i < data.d.results.length; i++)
			{
				$("#filterDocumentType").append("<option value='" + data.d.results[i] + "' " + (userSearchSystemType== data.d.results[i] ? " selected " : "") + ">" + data.d.results[i] + "</option>");
				localSystemTypes += data.d.results[i] + ";";
			}		
			
			try {
				$('#filterDocumentType').selectmenu("refresh");
			} catch (err) {}
			
			localstorage.set("localSystemTypes", localSystemTypes);
		}
	}
	catch(err) {}
}

function performSearch()
{
	
	NavigatePage("#pgRedirect?url=#pgSearch");

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
				switch (catalog.OpportunityModality)
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
				}
				
				//<a data-mini="true" data-inline="true" data-role="button" href="javascript: addStatusAction('+catalog.ID+');" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" class="ui-btn ui-shadow ui-btn-corner-all ui-mini ui-btn-inline ui-btn-up-c">
				
				
					temp += '<table class="search-item" ><tr><td style="width:3px;background-color:'+ ModalityColorCode +'">&nbsp;</td><td>';
					temp += '<div id="ProjectCard" class="panel-body" style="padding-bottom: 0">';
					temp += '<a href="javascript: EditProjectDetailsAction('+catalog.ProjectID+');" style="text-decoration:none;color: inherit; display: block;">'
					temp += '<h2 style="color: blue; margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.AccountName + '</h2>';
					temp += '<div class="row"><div class="col-lg-6 col-md-6"><h3 style="margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<input type="hidden" name="hfCurrentMode" id="hfCurrentMode" value="READONLY"></div><div class="col-lg-6 col-md-6 pull-right" style="padding-right: 0; margin-right: 0;">';
					//temp += '<style>table td, table th {border: 1px solid #dddddd;}</style>';
					temp += '<table class="table table-condensed" style="margin-bottom:0; margin-right:0; border:0px; margin-top:0;"><tbody>';
					temp += '<tr><td style="text-align: left; width: 250px;	border: 1px solid #dddddd;">Last Modified: ' + catalog.Modified +'</td></tr>';
					temp += '</tbody></table></div></div></a></div>';
					temp += '</td></tr></table>';
				
				

				$( "#divSearchResults" ).append(temp);
			}
			
			//$(".btnAddStatus").button('refresh');
			$('.btnAddStatus').attr("data-theme", "a").removeClass("ui-btn-up-e").addClass("ui-btn-up-a");
		}
		else
		{
			//no item
			var temp = "<br /><center>No item found.</center>";
			
			temp += "<br />";			
			if (userSearchText != "")
				temp += "<div><center><i>Keyword:</i> <b>"+ userSearchText +"</b></center></div>";

			temp += "<div><center><i>System Type:</i> <b>"+ userSearchSystemType +"</b></center></div>";
			
			$( "#divSearchResults" ).text("").append(temp);
		}
	}
	catch(err) {
		$( "#divSearchResults" ).text("").append("Internal application error.");
	}
}




/******************* History ***********************/
$( document ).on( "pagebeforeshow", "#pgHistory", function(event) {	
	checkUserLogin();
	
	$( "#divHistoryResults" ).text("").append(getLoadingImg());	
	
	var _url = serviceRootUrl + "svc.aspx?op=GetHistoryStatuses&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader;
	Jsonp_Call(_url, false, "callbackPopulateHistories");
});

function callbackPopulateHistories(data)
{
	try {
		//console.log(data);
		if (data.d.results.length > 0)
		{
			$( "#divHistoryResults" ).text("");
			
			for(var i=0; i < data.d.results.length; i++)
			{
				var status = data.d.results[i];
				var temp = "";
					temp += '<table class="table-catalog-info">';
						temp += '<tr>';
							temp += '<td class="catalog-info">';
								temp += '<div class="col-xs-12 div-history-status-info history-collapsed itemid_' + status.ID + '">';
									temp += '<table width="100%" cellpadding="0" cellspacing="0"><tr><td onclick="toggleHistoryStatusDetails(this)"  valign="top">';
										temp += '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
										temp += '<td rowspan="2" class="collapsed-expanded-icon" valign="middle"><div>&nbsp;</div></td>';
										temp += '<td valign="top"><span class="head-cat"><b>' + status.Modality + ' (' + status.SystemType + ')</b></span></td>';										
										temp += '<td align="right">' + status.Modified + '</td></tr>';
										temp += '<tr><td valign="top">Serial #: ' + status.SerialNumber + '</td>';
										temp += '<td align="right">Submission: <i>' + (status.IsFinal == "Yes" ? "<b>Final</b>" : "Draft") + '</i></td></tr>';
										temp += '</table>';
										
									if (status.IsFinal == "No")
										temp += "</td><td width='40' align='right' valign='middle'> <a href=''javascript:void(0);' onclick='NavigatePage(\"#pgAddStatus?sid=" + status.ID + "\")' class='ui-btn ui-icon-edit ui-mini ui-btn-icon-notext'></a>";
									else
										temp += "</td><td width='40' align='right' valign='middle'> <a href='javascript:void(0);' class='ui-btn ui-icon-edit ui-mini ui-btn-icon-notext ui-disabled'></a>";
									temp += "</td></tr></table>";
								temp += '</div>  ';
								temp += '<div id="divHistoryStatusDetails">  ';
									temp += '<table width="100%">';
										temp += '<tr>';
											temp += '<td class="history-item-title" width="30%">System serial number:</td>';
											temp += '<td class="history-item-value" width="70%">' + status.SerialNumber + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Software version:</td>';
											temp += '<td class="history-item-value">' + status.SoftwareVersion + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Revision Level:</td>';
											temp += '<td class="history-item-value">' + status.RevisionLevel + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Date:</td>';
											temp += '<td class="history-item-value">' + status.SystemDate + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">CSS:</td>';
											temp += '<td class="history-item-value">' + status.MCSS + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Modality:</td>';
											temp += '<td class="history-item-value">' + status.Modality + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Comments:</td>';
											temp += '<td class="history-item-value" colspan="3">' + status.Comments + '</td>';
										temp += '</tr>';
									temp += '</table>';
									temp += '<br />';
									temp += '<table width="100%">';
										temp += '<tr>';
											temp += '<td class="history-item-section-header" colspan="4"><b>System condition on arrival</b></td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title" width="50%">Control panel layout:</td>';
											temp += '<td class="history-item-value" width="50%">' + status.ControlPanelLayout + '</td>';
										temp += '</tr>';
										if (status.ControlPanelLayout=='Control panel changed') {
											temp += '<tr ng-show="" style="font-style:italic;">';
												temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
												temp += '<td class="history-item-value">' + status.LayoutChangeExplain + '</td>';
											temp += '</tr>';
										}
										temp += '<tr>';
											temp += '<td class="history-item-title">Modality work list empty:</td>';
											temp += '<td class="history-item-value">' + status.ModalityWorkListEmpty + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">All software loaded and functioning:</td>';
											temp += '<td class="history-item-value">' + status.AllSoftwareLoadedAndFunctioning + '</td>';
										temp += '</tr>';
										
										if (status.AllSoftwareLoadedAndFunctioning=='No') {
											temp += '<tr ng-show="" style="font-style:italic;">';
												temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
												temp += '<td class="history-item-value">' + status.IfNoExplain + '</td>';
											temp += '</tr>';
										}
										temp += '<tr>';
											temp += '<td class="history-item-title">NPD presets on system:</td>';
											temp += '<td class="history-item-value">' + status.NPDPresetsOnSystem + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">HDD free of patients studies:</td>';
											temp += '<td class="history-item-value">' + status.HDDFreeOfPatientStudies + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Demo images loaded on hard drive:</td>';
											temp += '<td class="history-item-value">' + status.DemoImagesLoadedOnHardDrive + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-section-header" colspan="4"><b>Before leaving customer site</b></td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">System performed as expected:</td>';
											temp += '<td class="history-item-value">' + status.SystemPerformedAsExpected + '</td>';
										temp += '</tr>';
										
										if (status.SystemPerformedAsExpected=='No') {
											temp += '<tr style="font-style:italic;">';
												temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
											   temp += ' <td class="history-item-value">' + status.SystemPerformedNotAsExpectedExplain + '</td>';
											temp += '</tr>';
										}
										temp += '<tr>';
											temp += '<td class="history-item-title">Were any issues discovered with system during demo:</td>';
											temp += '<td class="history-item-value">' + status.AnyIssuesDuringDemo + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Was service contacted:</td>';
											temp += '<td class="history-item-value">' + status.wasServiceContacted + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Confirm modality work list removed from system:</td>';
											temp += '<td class="history-item-value">' + status.ConfirmModalityWorkListRemoved + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Confirm system HDD emptied of all patient studies:</td>';
											temp += '<td class="history-item-value">' + status.ConfirmSystemHDDEmptied + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-section-header" colspan="4"><b>Additional Comments</b></td>';
										temp += '</tr>';
										
										if (status.AdditionalComments !='') {
											temp += '<tr>';
												temp += '<td class="history-item-value" colspan="2" style="font-weight:normal;">';
													temp += '<div>' + status.AdditionalComments + '</div>';
												temp += '</td>';
											temp += '</tr>';
										}
										if (status.AdditionalComments=='') {
											temp += '<tr>';
												temp += '<td class="history-item-value" colspan="2" style="font-weight:normal;">No comment found.</td>';
											temp += '</tr>';
										}
										temp += '<tr>';
											temp += '<td class="history-item-value" colspan="2" style="font-weight:normal;text-align:center;padding-top: 10px;padding-bottom: 10px;">';
												temp += '<textarea id="taAdditionalComment' + status.ID + '" rows="2" style="width: 100%"></textarea>';
												temp += '<div id="divAddCommentError' + status.ID + '" style="color:red;display:none;">* Comment cannot be empty</div>';
												temp += '<a id="btnAddComment_' + status.ID + '" data-mini="true" data-inline="true" data-role="button" href="javascript: saveAdditionalComment(' + status.ID + ');" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" class="ui-btn ui-shadow ui-btn-corner-all ui-mini ui-btn-inline ui-btn-up-c"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">Add Comment</span></span></a>';
											temp += '</td>';
									   temp += '</tr>';
									temp += '</table> '; 
								temp += '</div> ';        
							temp += '</td>';
						temp += '</tr>';
					temp += '</table>';
					temp += '<div class="divRowSeparator"></div>';
					
					
				$("#divHistoryResults").append(temp);
			}
			
			var _id = $.urlParam("id");
			if (_id != "" && parseInt(_id) > 0)
			{
				$("div.itemid_" + _id).removeClass("history-collapsed").addClass("history-expanded");
				$("div.itemid_" + _id).next().show();
			}
		}
		else 
		{
			$( "#divHistoryResults" ).text("").append("<br /><center>No history found.</center>");
		}
	}
	catch(err) {
		$( "#divHistoryResults" ).text("").append("Internal application error.");
	}
}

function toggleHistoryStatusDetails(obj) {
    if ($(obj).closest("div").hasClass("history-collapsed")) {
        $(obj).closest("div").removeClass("history-collapsed").addClass("history-expanded");
        $(obj).closest("div").next().show();
    }
    else {
        $(obj).closest("div").removeClass("history-expanded").addClass("history-collapsed");
        $(obj).closest("div").next().hide();
    }
}

function saveAdditionalComment(id) {
	var comment = $("#taAdditionalComment" + id).val();

	$("#divAddCommentError" + id).hide();

	if (jQuery.trim(comment) != "") {
		$("#divAddCommentError" + id).text("").append(getLoadingMini()).show();
		
		var _url = serviceRootUrl + "svc.aspx?op=AddAdditionalComments&SPUrl=" + spwebRootUrl + "sites/busops&itemid=" + id + "&comment=" + comment + "&authInfo=" + userInfoData.AuthenticationHeader + "&WorkPhone=" + userInfoData.Phone;
		Jsonp_Call(_url, false, "callbackAddComment");
	}
	else {
		$("#divAddCommentError" + id).text("").append("* Comment cannot be empty").show();
	}
};

function callbackAddComment(data)
{
	try {
		//console.log(data);
		if (data.d.results.length > 0)
		{
			NavigatePage("#pgRedirect?url=" + encodeURIComponent("#pgHistory?id=" + data.d.results[0]));
		}
	}
	catch(err) { }
}


/******************* Project Options ***********************/

function GoToProjectDetails() {
	var ProjectID= ($.urlParam("ProjectID"));
	NavigatePage('#pgProjectDetails?id=' + ProjectID);
}


/******************* Swipe Construction ***********************/
$(document).on('pageinit',"#pgConstruction",function(event){

	$("#divAddStatus").on("swipeleft",function(){
		$("#pnlProjectDetails").panel( "open");
	});
	$("#divAddStatus").on("swiperight",function(){
		$("#pnlProjectActivity").panel( "open");
	});
});

/******************* Swipe IPM Activity ***********************/
$(document).on('pageinit',"#pgIPMActivity",function(event){

	$("#divAddIPMActivity").on("swipeleft",function(){
		$("#pnlProjectDetails-IPMActivity").panel( "open");
	});
	$("#divAddIPMActivity").on("swiperight",function(){
		$("#pnlProjectActivity-IPMActivity").panel( "open");
	});
});

/******************* Swipe SPR ***********************/
$(document).on('pageinit',"#pgSitePlanRequests",function(event){

	$("#divAddSitePlanRequests").on("swipeleft",function(){
		$("#pnlProjectDetails-SitePlanRequests").panel( "open");
	});
	$("#divAddSitePlanRequests").on("swiperight",function(){
		$("#pnlProjectActivity-SitePlanRequests").panel( "open");
	});
});
/******************* Swipe EMRF ***********************/
$(document).on('pageinit',"#pgEMRF",function(event){

	$("#divAddEMRF").on("swipeleft",function(){
		$("#pnlProjectDetails-EMRF").panel( "open");
	});
	$("#divAddEMRF").on("swiperight",function(){
		$("#pnlProjectActivity-EMRF").panel( "open");
	});
});
/******************* Load EMRF ***********************/
$( document ).on( "pagebeforeshow", "#pgEMRF", function(event) {
	checkUserLogin();
	
	
	
	$('#tblEMRF').hide();
	$('#tblEMRFButtons').hide();

	$('#error-div-EMRF').text("").append(getLoadingMini());
	$("#ddlSortBy-EMRF").val('ShipToSite').selectmenu('refresh', true);

		
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
				var TableRow = $('<div style="margin: 5px 0px 5px 0px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ShipToSite +'</span><br><span style="font-size:x-small;">'+ catalog.Status +' - '+ catalog.SentToTCSubCategory +'</span><br><span style="font-size:x-small;">Delivery Date:'+ catalog.DelvDate  +'</span><br><span style="font-size:x-small;">'+catalog.ItemDetail +'</span></div>');
				TableRow.appendTo($("#EMRFGrid"));
				

			}
			var id = $.urlParam("id");
			if (id > 0)
			{
				var _url1 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url1, true, "callbackLoadEMRFSidePanelIPMActivity");

				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
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
					temp += '<div class="row"><div class="col-lg-6 col-md-6"><h3 style="margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';
					
				$("#pnlProjectDetails-EMRF" ).html(temp);


				$('#error-div2-EMRF').text("");
				$('#error-div-EMRF').text("");
					
				$('#tblEMRF').show();
				$('#tblEMRFButtons').show();
				
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

	$("#divAddContacts").on("swipeleft",function(){
		$("#pnlProjectDetails-Contacts").panel( "open");
	});
	$("#divAddContacts").on("swiperight",function(){
		$("#pnlProjectActivity-Contacts").panel( "open");
	});
});
/******************* Load Contacts ***********************/
$( document ).on( "pagebeforeshow", "#pgContacts", function(event) {
	checkUserLogin();
	
	
	
	$('#tblContacts').hide();
	$('#tblContactsButtons').hide();

	$('#error-div-Contacts').text("").append(getLoadingMini());
	$("#ddlSortBy-Contacts").val('ShipToSite').selectmenu('refresh', true);

		
	$("#ContactsGrid").text("");
	var id = $.urlParam("id");
	if (id > 0)
	{
	
		var _url2 = serviceRootUrl + "svc.aspx?op=GetContacts&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id ;
		Jsonp_Call(_url2, false, "callbackLoadContacts");
	}
	else 
	{
		///
			alert("App Error");
	}
	

	
});



function callbackLoadContacts(data)
{


	try {

		
//		if (data.d.results.length > 0)
//		{
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				var TableRow = $('<div style="margin: 5px 0px 5px 0px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.Name +'</span><br><span style="font-size:x-small;">Phone: '+ catalog.Phone +'</span></div>');
				TableRow.appendTo($("#ContactsGrid"));
				

			}

			var id = $.urlParam("id");
			if (id > 0)
			{
				var _url1 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url1, true, "callbackLoadContactsSidePanelIPMActivity");

				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
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
					temp += '<div class="row"><div class="col-lg-6 col-md-6"><h3 style="margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified +'</em></h6>';
					temp += '</div></div></div>';
					temp += '</td></tr></table>';
					
				$("#pnlProjectDetails-Contacts" ).html(temp);


				$('#error-div2-Contacts').text("");
				$('#error-div-Contacts').text("");
					
				$('#tblContacts').show();
				$('#tblContactsButtons').show();
				
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
	$("#ddlSortBy-SitePlanRequests").val('ProjectNumber').selectmenu('refresh', true);
		
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
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				var TableRow = $('<div style="margin: 5px 0px 5px 0px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ProjectNumber +' - '+ catalog.DrawingType +' - '+ catalog.Status +'</span><br><span style="font-size:x-small;">IPM:'+ catalog.IPM_Assigned  +'</span><br><span style="font-size:x-small;">Planner:'+catalog.Planner_Assigned +'</span></div>');
				TableRow.appendTo($("#SitePlanRequestsGrid"));
				

			}

			var id = $.urlParam("id");
			if (id > 0)
			{
				var _url1 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url1, true, "callbackLoadSitePlanRequestsSidePanelIPMActivity");

				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
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
					temp += '<div class="row"><div class="col-lg-6 col-md-6"><h3 style="margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified +'</em></h6>';
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
			$(this).val(getISODateString(Date()));
			
	});	
	$("#ddlActivityType").val('7').selectmenu('refresh', true);
	$("#txtComments").val("");
	
		
	$("#IPMActivityGrid").text("");
	var id = $.urlParam("id");
	if (id > 0)
	{
	
		var _url2 = serviceRootUrl + "svc.aspx?op=GetIPMActivity&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
		Jsonp_Call(_url2, false, "callbackLoadIPMActivity");
	}
	else 
	{
		///
			alert("App Error");
	}
	

	
});



function callbackLoadIPMActivity(data)
{


	try {

		
//		if (data.d.results.length > 0)
//		{
			var temp = '<div class="ui-grid-b ui-responsive" id="IPMActivityGridSidePanel" name="IPMActivityGridSidePanel" style="padding-right:10px;">';
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				var TableRow = $('<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;background-color:#f2f2f2;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>');
				TableRow.appendTo($("#IPMActivityGrid"));
				
				temp += '<div style="margin: 5px 5px 5px 5px;padding: 2px 2px 2px 2px;border:1px solid #dddddd;border-radius: 5px;text-align:left;" class="ui-block-a my-breakpoint ui-responsive"><span style="font-size:small;font-weight:bold;">' + catalog.ActivityDate +' - '+ catalog.CreatedBy +' - '+ catalog.ActivityType +'</span><br><span style="font-size:x-small;">'+ catalog.Comments  +'</span></div>';

			}
			
			temp += '</div>';
			$("#pnlProjectActivity-IPMActivity" ).html(temp);


			var id = $.urlParam("id");
			if (id > 0)
			{
			
				var _url2 = serviceRootUrl + "svc.aspx?op=GetProjectById&SPUrl=" + spwebRootUrl + "sites/busops&username=" + userInfoData.Email + "&id=" + id;
				Jsonp_Call(_url2, false, "callbackLoadIPMActivitySidePanel");
			}

					
//		}
		else
		{
			//
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
					temp += '<div class="row"><div class="col-lg-6 col-md-6"><h3 style="margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified +'</em></h6>';
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
			txtActivityDate : $("#txtActivityDate").val(),

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

		
			SetRadioValue('SR_Construction_Progress', catalog.ConstructionProgress);
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

			if (parseInt(catalog.OverrideConfidenceLevel) == 1 || parseInt(catalog.Confidence) >= 60)
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
					temp += '<div class="row"><div class="col-lg-6 col-md-6"><h3 style="margin-top: 2px; margin-bottom: 2px;">';
					temp += catalog.SystemVal + '</h3>';
					temp += '<h3 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.BillTrakAmount +' on '+ catalog.ExpectedBillDate +'</h3>';
					temp += '<h4>Project/SID# '+ catalog.ProjectID + '/' + catalog.SID +'</h4>';
					if (catalog.ConfirmedDeliveryDate!='')
						temp += '<h4 style="margin-top: 0px; margin-bottom: 2px;">Delivery Date '+ catalog.ConfirmedDeliveryDate+'</h4>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.Address1 + catalog.Address2 + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.City + catalog.State + ' ' + catalog.ZipCode + '</h5>';
					temp += '<h5 style="margin-top: 2px; margin-bottom: 2px;">'+ catalog.ZoneName + ' Zone</h5>';
					temp += '<h6 style="margin-top: 6px; margin-bottom: 2px;"><em>Last Update: ' + catalog.Modified +'</em></h6>';
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
		txtSR_Construction_Weeks : $("#txtSR_Construction_Weeks").text(),		
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
		txtSR_Electronic_Date : $("#txtSR_PreConstruction_Meeting_Scheduled_Date").val(),
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
	
		if (txtSR_Forecasted_Site_Ready_Date!="" && NumberOfDays < 90){
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
		NavigatePage(decodeURIComponent($.urlParamRedirect("url")));
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

function SnapPhoto() {  
       navigator.camera.getPicture(  
         uploadPhoto,  
         function(message) { alert('Camera failed'); },  
         {  
           quality     : 50,  
           destinationType : navigator.camera.DestinationType.FILE_URI,  
           sourceType   : navigator.camera.PictureSourceType.CAMERA  
         }  
       );  
     }  
function SelectPhoto() {  
       navigator.camera.getPicture(  
         uploadPhoto,  
         function(message) { alert('Get picture failed'); },  
         {  
           quality     : 50,  
           destinationType : navigator.camera.DestinationType.FILE_URI,  
           sourceType   : navigator.camera.PictureSourceType.PHOTOLIBRARY  
         }  
       );  
     }  
     function uploadPhoto(imageURI) {  
	   var options = new FileUploadOptions();  
   
       options.fileKey="file";  
       options.fileName="c:\\logs\\MobileImages\\" + imageURI.substr(imageURI.lastIndexOf('/')+1);  
       options.mimeType="image/jpeg";  
       var params = {};  
       params.ProjectID = $.urlParam("id");  
       params.ProjectActivityID = "2";  
       params.CreatedBy = userInfoData.UserID ;  
       options.params = params;  
       var ft = new FileTransfer();  
	   var _url =  serviceRootUrl + "svc.aspx?op=UploadFile";
	   
       ft.upload(imageURI, encodeURI(_url), snapwin, snapfail, options); 
			console.log(_url);
			
//			Jsonp_Call(_url, true, "callbackSaveStatus");
	   
	   
	   
     }  
     function snapwin(r) {  
		saveIPMActivity(isFinal);
     }  
     function snapfail(error) {  
       alert("An error has occurred sending photo: Code = " + error.code);  

     }  


