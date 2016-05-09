// JScript File
//******************************************************************
// callable functions in this library:
//******************************************************************
// isDirty() - checks to see if any changed were made to the page and confirms that the
//             user wants to navigate away from the page
// setDirty() - sets bDirty to true
// resetDirty() - set bDirty to false
// newWindow(url, wname,features) - opens a child window tracked by the window manager
// createWindow(url, wname) - opens a child window tracked by the window manager
// closeWindows() - closes all windows opened by the window manager
// setStatus() - sets the status bar in the window
// getTimeStamp() - creates a unique timestamp to prevent caching issues
//******************************************************************

//create an array to hold references to child windows, and a var to hold status of page changes
var windows = new Array()
var bDirty = false;

function getTimeStamp() {
	DTnow = new Date();            // create new date object 'DTnow'   
	//Year  = DTnow.getYear();       // years since 1900 (maybe! - not entirely sure)
	Year =  DTnow.getFullYear();   // years since 1900 (maybe! - not entirely sure)
	Month = DTnow.getMonth();      // month-of-year field (0-11)
	DayW  = DTnow.getDay();        // day-of-week field (0-6)
	DayM  = DTnow.getDate();       // day-of-month field (1-31)
	Hour  = DTnow.getHours();      // hours field (0-23)
	Mins  = DTnow.getMinutes();    // minutes field (0-59)
	Secs  = DTnow.getSeconds();    // seconds field (0-59)
	
	timeStamp = Month+""+DayM+""+DayW+""+Mins+""+Year+""+Hour+""+Secs;
	return timeStamp
}

function newWindow(url, wname, features)
{
//	var features = "";
//	if (null != arguments[2])
//		features = arguments[2];
	return window.open(url, wname, features);
}

function createWindow(url, wname, winWidth, winHeight)
{
//	var features = arguments[2] == null ? "" : arguments[2];

    var popW; 
	var popH;
	var leftPos;
	var topPos;

    if ((winWidth == 0) || (winHeight == 0)){ //maximize window
       popW = screen.availWidth;
       popH = screen.availHeight;
       topPos = screen.availTop;
       leftPos = screen.availLeft;
    }   
    else {
	   var w = 480, h = 340;

	   if (document.all || document.layers) {
		  w = screen.availWidth;
		  h = screen.availHeight;
	   }

	   // if height, width not specified use default
	   if (winWidth == null)
		  popW = 432;
	   else
		  popW = winWidth;
		
	   if (winHeight == null) 
		  popH = 400;
	   else
		  popH = winHeight;

	   leftPos = (w-popW)/2;
	   topPos = (h-popH)/2;
	}

	var features = "scrollbars=yes, resizable=yes, toolbar=no, menubar=no, copyHistory=no, status=yes, ";
	features += "width=" + popW + ", height=" + popH + ", top=" + topPos + ", left=" + leftPos;
	
	//alert(features);
	var tsx = getTimeStamp();
    if (url.indexOf('?') > -1)
        url=url+'&tsx='+tsx;
    else
        url=url+'?tsx='+tsx;
         
    //add child window flag
    url=url+'&child=yes';
    
    //add modal flag
    url=url+'&modal=no';
    windows[wname] = new newWindow(url, wname, features);
}

function getModalWindowOptions(winWidth, winHeight) {
    var winOptions;

    if (window.showModalDialog) {//IE
        winOptions = 'height=' + winHeight + ',width=' + winWidth + ',toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,modal=yes,alwaysRaised=yes';
    }
    else {//Mozilla based
        winOptions = 'height=' + winHeight + ',width=' + winWidth + ',toolbar=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,modal=yes';
    }

    return winOptions;
}

/*
    this works the same as the original popModalWindow except it allows you to wait
    for the opened modal window to be closed and call a function (func) to do something
    after it closes.  Your function has to handle one argument which is an array.  This
    way we can send any number of arguments to the function
*/
function popModalWindowWait(url, modalName, winWidth, winHeight, func, args) {
    var winOptions;
    if (winWidth == null)
        winWidth = 432;

    if (winHeight == null)
        winHeight = 400;

    var tsx = getTimeStamp();
    if (url.indexOf('?') > -1)
        url = url + '&tsx=' + tsx;
    else
        url = url + '?tsx=' + tsx;

    //add child window flag
    url = url + '&child=yes';

    //add modal flag
    url = url + '&modal=yes';
    if (window.showModalDialog) {//IE
        winOptions = 'height=' + winHeight + ',width=' + winWidth + ',toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,modal=yes,alwaysRaised=yes';
    }
    else {//Mozilla based
        winOptions = 'height=' + winHeight + ',width=' + winWidth + ',toolbar=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,modal=yes';
    }
    var win = window.open(url, modalName, winOptions);

    // this is used to handle submitting when the window closes 
    var pollTimer = window.setInterval(function () {
        if (win.closed !== false) { // !== is required for compatibility with Opera
            window.clearInterval(pollTimer);
            return func(args);
        }
    }, 200);
}

function popModalWindow(url, modalName, winWidth, winHeight) {
   var winOptions;
   if (winWidth == null)
		winWidth = 432;
		
   if (winHeight == null)
   		winHeight = 400;
   		
   var tsx = getTimeStamp();
   if (url.indexOf('?') > -1)
         url=url+'&tsx='+tsx;
      else
         url=url+'?tsx='+tsx;
         
   //add child window flag
   url=url+'&child=yes';
   
   //add modal flag
   url=url+'&modal=yes';
   if (window.showModalDialog){//IE
       winOptions = 'height=' + winHeight + ',width=' + winWidth + ',toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,modal=yes,alwaysRaised=yes';
   }
   else{//Mozilla based
      winOptions = 'height='+winHeight+',width='+winWidth+',toolbar=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,modal=yes';
  }

  window.open(url, modalName, winOptions);

}

function closeWindows()
{
	for (w in windows){
	   if (!windows[w].closed)
	   {
		  windows[w].close();
	   }
	}	
}

function listWindows()
{
	var swin = "window list\n";
	for (w in windows)
		swin += w + ";" +
			((windows[w].closed) ? "Closed" : "Open") + "\n";
		alert(swin);
}

function setStatus(message)
{
	window.defaultStatus = "ready";
	window.status = message;
}

function isDirty()
{
	if (bDirty)
	{
		event.returnValue = "Do you wish to continue without saving?\n\nClick 'OK' to continue without saving. Click 'Cancel' to return and save any changes.";
	}
}

function isDirtyConfirm()
{
	if (bDirty)
		return confirm("Do you wish to continue without saving?\n\nClick 'OK' to continue without saving. Click 'Cancel' to return and save any changes.");
	else
		return true;
}

function setDirty()
{
	bDirty = true;
}

function resetDirty()
{
	bDirty = false;
}

function createReportWindow(url, winName, winOptions) 
{
	if (winOptions==null) 
		winOptions='toolbar=0,location=1,statusbar=0,menubar=0,scrollbars=1,resizable=1,width=680,height=600,left=200,top=50';
	
	var tsx = getTimeStamp();
    if (url.indexOf('?') > -1)
        url=url+'&tsx='+tsx;
    else
        url=url+'?tsx='+tsx;
         
    //add child window flag
    url=url+'&child=yes';
    
    //add modal flag
    url=url+'&modal=no';
	windows[winName] = new newWindow(url, winName, winOptions);
}

function PageQuery(q) {
    if(q.length > 1) this.q = q.substring(1, q.length);
    else this.q = null;
    
    this.keyValuePairs = new Array();
    if(q) {
        for(var i=0; i < this.q.split("&").length; i++) {
            this.keyValuePairs[i] = this.q.split("&")[i];
        }
    }
    
    this.getKeyValuePairs = function() { return this.keyValuePairs; }
    
    this.getValue = function(s) {
                                    for(var j=0; j < this.keyValuePairs.length; j++) {
                                        if(this.keyValuePairs[j].split("=")[0] == s)
                                        return this.keyValuePairs[j].split("=")[1];
                                    }
                                    return false;
                                }

    this.getParameters = function() {
                                        var a = new Array(this.getLength());
                                        for(var j=0; j < this.keyValuePairs.length; j++) {
                                            a[j] = this.keyValuePairs[j].split("=")[0];
                                        }
                                        return a;
                                    }
    this.getLength = function() { return this.keyValuePairs.length; } 
}

function queryString(key){
    var page = new PageQuery(window.location.search);
    return unescape(page.getValue(key)); 
}


/*
finds all open windows and close them up to the root window
root window will be refreshed
search starts from the window being requested.
function is meant for closing multiple windows opened from the main app window when session has expired
*/
function detectWindowHierarchy()
{
    window.closeWindows(); //close children windows
    window.close(); //close window
    //call parent window(opener)
    if (window.opener)
    {
        //opened via window.open
        findWindow(window.opener);
    }
    else
    {
        //opened via window.showModalDialog
        if (window.dialogArguments)
        {
            findWindow(window.dialogArguments);
        }
    }
}

function findWindow(parentWindow)
{
    if (parentWindow.opener) //window opened via window.open
    {
        //close child windows
        parentWindow.closeWindows();
        //close window
        parentWindow.close();
        //call parent window
        findWindow(parentWindow.opener);
    }
    else if (parentWindow.dialogArguments)  //window opened via window.showModalDialog
    {
        //close child windows
        parentWindow.closeWindows();
        //close window
        parentWindow.close();
        //call parent window
        findWindow(parentWindow.dialogArguments);
    }
    else if (parentWindow.self != parentWindow.top) //window is embedded in a frame?
    {
        //close child windows
        parentWindow.closeWindows();
        //close window
        parentWindow.close();
        //call parent window
        findWindow(parentWindow.parent); 
    }
    else  //root window in hierarchy
    {
        //close child windows of root window
        parentWindow.closeWindows();
        //refresh root window
        parentWindow.document.forms[0].submit();
    }        
}
