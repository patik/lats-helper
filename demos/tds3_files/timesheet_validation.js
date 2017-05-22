// JScript File
//******************************************************************
// callable functions in this library:
//******************************************************************
// preventChange() - prevents a checkbox from being changed from it's current clicked/unclicked status
// ValidateOTMeal() - validates the value for OT Meals so only a 0, 1, or 2 is entered
// ValidateTardyTime() - validates the value of Tardy time entered
// ValidateTime() - validates the value of a time entered
// ValidateExtrasTime() - validates the value of a time entered for the "Extras" input
//validateOT() - validates OT row entries. Applicable to NonComp, CompOver40, PaidComp & Part-timePaid Extra
//******************************************************************
var errorCount = 0;

function ValidateOTMeal(oControl,cell) {
    setDirty();
	var val;
	var objRegExp;
	val=Trim(oControl.value);
	if (val != ""){
	    objRegExp  =  /^[0-2]$/;
	    if (!objRegExp.test(val)){
           alert('Valid entries for OT Meals are 0, 1 or 2.');
           incrementErrorCount(oControl,cell);
        }
        else {
           decrementErrorCount(oControl,cell);
        }   
	}
	else {
	   oControl.value="0";
	   decrementErrorCount(oControl,cell);
	}
}

function LimitTardy(LimitTardy15) {
	return (LimitTardy15 == "Y" || LimitTardy15 == "y");
}

function incrementErrorCount(oControl,cell){
   if (oControl.getAttribute("isValid") == "Y"){
	  oControl.setAttribute("isValid", "N");
	  errorCount++;
      document.getElementById(cell).style.background = '#008000';
   }
}

function decrementErrorCount(oControl,cell){
   if (oControl.getAttribute("isValid") == "N"){
	  oControl.setAttribute("isValid", "Y");
	  errorCount--;
      document.getElementById(cell).style.background = '#CCCCCC';
   }
}

function validateCharges(oControl,cell,hhmm,hrsPerDay,enforceHOLMax){
   setDirty();
   var objRegExp;
   var strValue = Trim(oControl.value); 
   var setMax = 24.00;
   var arrValues;
   var passed = true;
   var message;
   var calMax;
   var beforeDelimiter;
   var afterDelimiter;
   var delimiter = ".";
   if (hhmm == 'Y'){
      delimiter = ":";
   }
   
   if ((strValue != '0') && (strValue != '') && (strValue != ':00)')) {
      var pos = strValue.indexOf(delimiter);
      if (pos != -1) {
         arrValues = strValue.split(delimiter);
         beforeDelimiter = arrValues[0];
         afterDelimiter = arrValues[1];
         if (beforeDelimiter == '') //no hours entered
            beforeDelimiter = "0";
      }
      else {
         beforeDelimiter = strValue;
         afterDelimiter = "00";
      }
      
      if (hhmm == 'Y'){ //HH:MM
         objRegExp  =  /(^\d\d*\:\d{2,2}$)|(^\d\d*$)|(^\:\d{2,2}$)/;
         if (passed && (!objRegExp.test(strValue))){
            message = 'Please enter your hours in hh:mm format. For example 2:30, 5:45, 7:30 etc';
            passed = false;
         }
         
         if (passed && (parseInt(afterDelimiter) > 59)) {
            message = 'Minutes can not be greater than 59';
            passed = false;   
         }
         calMax = parseInt(beforeDelimiter) + parseInt(afterDelimiter)/60;
      }
      else { //decimal hrs
         objRegExp  =  /(^\d\d*\.\d{1,2}$)|(^\d\d*$)|(^\.\d{1,2}$)/;
         if (passed && (!objRegExp.test(strValue))){
            message = 'Only non-negative numeric values with no more than two decimal places allowed.';
            passed = false;
         }
         if (passed && (afterDelimiter != "25" && afterDelimiter != "5" && afterDelimiter != "50" && afterDelimiter != "75" && afterDelimiter != "0" && afterDelimiter != "00")) {
            message = 'Entries must be in quarter hour increments. For example 7.5, 5.25, 4.0 etc';
            passed = false;   
         }
         calMax = strValue;
      }   
      
      //Can charge more than hrs/day when charging to HOL
      if (enforceHOLMax == 'Y'){
         //hrsPerDay is in decimal hrs i.e. 700,750,800 etc
         if (passed && (parseFloat(calMax) * 100 > parseFloat(hrsPerDay))) {
            message = 'You cannot charge to HOL more than your allocated hours per day.';
            passed = false;
         }
      }
      
      if (passed && (parseFloat(calMax) > parseFloat(setMax))) {
         message = 'You have entered more than the allowed maximum of 24.00 hours';
         passed = false;
      }  
       
      if (!passed){
         incrementErrorCount(oControl,cell);
	     alert(message);
      }
      else {
         decrementErrorCount(oControl,cell);
      }
   }
   else {
      if (hhmm == 'Y')
         oControl.value=':00';
      else
         oControl.value="0";
         
	  decrementErrorCount(oControl,cell);
   }
}

function ValidateTardyTime(oControl, LimitTardy15, cell) {
    setDirty();
	var TimeEntered = Trim(oControl.value);
	var message
	var passed = true;
	var arrTime;
	
	if (TimeEntered != '') {
	   if (LimitTardy15 == 'Y'){
	      objRegExp  =  /(^:[0-1][0-5]$)|(^:0[0-9]$)/;
	      if (passed && (!objRegExp.test(TimeEntered))){
	         message = "You may not charge more than 15 minutes to tardy time. Use the format :MM for example :10, :05, :15 etc.";
	         passed = false;
	      }
	   }
	   else {
	      objRegExp  =  /(^\d\d*\:[0-5]\d{1}$)|(^\:[0-5]\d{1}$)/;
	      if (passed & (!objRegExp.test(TimeEntered))){
	         message = "You may enter tardy time using the HH:MM format. For example 2:04, :50, 0:15 etc are valid but not 1:60";
	         passed = false;
	      }
	      arrTime = TimeEntered.split(":");
	      if (arrTime[0] == '') //no hours entered, zero it out
	         arrTime[0] = "0";
	         
	      if (passed && (parseInt(arrTime[0])* 60 + parseInt(arrTime[1]) > 1440)) { //1440 = 24 hours in minutes
	         message = "You may not enter a time greater than 24:00 hours.";
	         passed = false;
	      }
	   }
	}   
	else {
	   oControl.value = ":00";
	}
   
   if (!passed){
      alert(message);
      incrementErrorCount(oControl,cell);
   }
   else {
      decrementErrorCount(oControl,cell);
   }	
}	

function ValidateTime(oControl, cell){
   setDirty();
   
   var objRegExp;
   var TimeEntered = Trim(oControl.value);
   if (TimeEntered != '') {
      TimeEntered=TimeEntered.toUpperCase();
      //time entered should be of form 4:00 or 04:00 or 0400 with or without am/pm or a/p case does not matter
      objRegExp  =  /(^0[1-9]:?[0-5]\d\s?(A|P|AM|PM)?$)|(^1[0-2]:?[0-5]\d\s?(A|P|AM|PM)?$)|(^[1-9]:[0-5]\d\s?(A|P|AM|PM)?$)/;
      if (!objRegExp.test(TimeEntered)){
         alert("Time entered should be of form 4:00 p or 04:00p or 0400 with or without am/pm.\n AM or PM can be entered as A or P which can be upper or lower case.");
         incrementErrorCount(oControl,cell);
      }
      else {
         //passed validation, now add colon if applicable
         if (TimeEntered.search(":") == -1) {
            var frontTwo = TimeEntered.substr(0,2); 
	        var restOfString = TimeEntered.substr(2,TimeEntered.length);
	        TimeEntered=frontTwo+":"+restOfString;
         }
         //If has A or P then add M to make AM or PM
         if (((TimeEntered.search("A") > -1) || (TimeEntered.search("P") > -1)) && (TimeEntered.search("M") == -1)) {
            TimeEntered=TimeEntered + "M";
         }
         
         //Add a space if time is entered as 4:00PM or 04:00AM to be 4:00 PM or 04:00 PM for example
         if (TimeEntered.search(" ") == -1) {
            TimeEntered=TimeEntered.replace("AM", " AM");
            TimeEntered=TimeEntered.replace("PM", " PM");
         }
      
         oControl.value = TimeEntered;
         decrementErrorCount(oControl,cell);
      }
   }
   else {
      decrementErrorCount(oControl,cell);
   }
}

function ValidateExtrasTime(oControl, cell){
   setDirty();
      
   var objRegExp;
   var TimeEntered = Trim(oControl.value);
   if (TimeEntered != "") {
      TimeEntered=TimeEntered.toUpperCase();
      //time entered should be of form 4:00p or 04:00 p or 0400pm with am/pm or a/p case does not matter
      objRegExp  =  /(^0[1-9]:?[0-5]\d\s?(A|P|AM|PM)$)|(^1[0-2]:?[0-5]\d\s?(A|P|AM|PM)$)|(^[1-9]:[0-5]\d\s?(A|P|AM|PM)$)/;
      if (!objRegExp.test(TimeEntered)){
         alert("Extra time entered should be of form 4:00 or 04:00 or 0400 with one or no spaces before am/pm.\n AM or PM can be entered as A or P which can be upper or lower case.");
         incrementErrorCount(oControl,cell);
      }
      else {
         //passed validation, now add colon if applicable
         if (TimeEntered.search(":") == -1) {
            var frontTwo = TimeEntered.substr(0,2); 
	        var restOfString = TimeEntered.substr(2,TimeEntered.length);
	        TimeEntered=frontTwo+":"+restOfString;
         }
         //Has A or P then add M to make AM or PM
         if (TimeEntered.search("M") == -1) {
            TimeEntered=TimeEntered + "M";
         }
      
         oControl.value = TimeEntered;
         decrementErrorCount(oControl,cell);
      }
   }
   else {
      decrementErrorCount(oControl,cell);
   }   
}

function validateOT(oControl,cell,hhmm,qtrHourOT){
   setDirty();
   var objRegExp;
   var strValue = Trim(oControl.value); 
   var setMax = 24.00;
   var arrValues;
   var passed = true;
   var message;
   var calMax;
   var beforeDelimiter;
   var afterDelimiter;
   var delimiter = ".";
   if (hhmm == 'Y'){
      delimiter = ":";
   }
   
   if ((strValue != '0') && (strValue != '') && (strValue != ':00)')) {
      var pos = strValue.indexOf(delimiter);
      if (pos != -1) {
         arrValues = strValue.split(delimiter);
         beforeDelimiter = arrValues[0];
         afterDelimiter = arrValues[1];
         if (beforeDelimiter == '') //no hours entered
            beforeDelimiter = "0";
      }
      else {
         beforeDelimiter = strValue;
         afterDelimiter = "00";
      }
      
      if (hhmm == 'Y'){ //HH:MM
         objRegExp  =  /(^\d\d*\:\d{2,2}$)|(^\d\d*$)|(^\:\d{2,2}$)/;
         if (passed && (!objRegExp.test(strValue))){
            message = 'Please enter your hours in hh:mm format. For example 2:30, 5:45, 7:30 etc';
            passed = false;
         }
         
         if (passed && (parseInt(afterDelimiter) > 59)) {
            message = 'Minutes can not be greater than 59';
            passed = false;   
         }
         
         if (qtrHourOT == 'Y'){
             if (passed && (afterDelimiter != "00" && afterDelimiter != "15" && afterDelimiter != "30" && afterDelimiter != "45")) {
                message = 'Entries must be in quarter hour increments. For example 1:00, 1:15, 2:30 or 2:45';
                passed = false;   
             }
         }
         calMax = parseInt(beforeDelimiter) + parseInt(afterDelimiter)/60;
      }
      else { //decimal hrs
         objRegExp  =  /(^\d\d*\.\d{1,2}$)|(^\d\d*$)|(^\.\d{1,2}$)/;
         if (passed && (!objRegExp.test(strValue))){
            message = 'Only non-negative numeric values with no more than two decimal places allowed.';
            passed = false;
         }
         if (passed)
            strValue = Number(strValue).toFixed(2); //convert to a 2 decimal places entry i.e. 7 -> 7.00, -.5 -> 0.50 etc
            
         if (qtrHourOT == 'Y'){
             objRegExp  =  /(^\d\d*\.(00|25|50|75)$)/;
             if (passed && (!objRegExp.test(strValue))){
                message = 'Entries must be in quarter hour increments. For example 7.5, 5.25, 4.0, 3.5 etc';
                passed = false;   
             }
         }
         else {//can accrual to the minute in decimal form; 1 min = .02, 2mins = .03, 5mins = .08 etc
             objRegExp  =  /(^\d\d*\.\d{1}[0,2,3,5,7,8]?$)|(^\d\d*$)|(^\.\d{1}[0,2,3,5,7,8]?$)/;
             if (passed && (!objRegExp.test(strValue))){
                 message = 'Entries must be in decimal hours correct to the nearest minute.\n\nFor example 1min=.02, 3mins=.05, 6mins=.10, 10mins=.17 etc';
                 passed = false;
             }
         }
         calMax = strValue;
      }   
      
      if (passed && (parseFloat(calMax) > parseFloat(setMax))) {
         message = 'You have entered more than the allowed maximum of 24.00 hours';
         passed = false;
      }  
       
      if (!passed){
         incrementErrorCount(oControl,cell);
	     alert(message);
      }
      else {
         decrementErrorCount(oControl,cell);
      }
   }
   else {
      if (hhmm == 'Y')
         oControl.value=':00';
      else
         oControl.value="0";
         
	  decrementErrorCount(oControl,cell);
   }
}

