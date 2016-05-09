// JScript File

function saveWorkLoc()
{
    LATSnet.LATSweb.WebService1.HelloWorld(SucceededCallback)
}


// This is the callback function invoked if the Web service
// succeeded.
// It accepts the result object as a parameter.
function SucceededCallback(result, eventArgs)
{
    // Page element to display feedback.
    var RsltElem = document.getElementById("ResultId");
    RsltElem.innerHTML = result;
}

//This function show the modal popup window
//PopupExtenderID: BehaviorID of the Ajax ModalPopupExtender
function ShowModalPopup(PopupExtenderID){
   var ModalPopWindowShow = $find(PopupExtenderID);
   if (ModalPopWindowShow) {
        ModalPopWindowShow.show();
    }
  return false;
 }
 
 //This function hide the modal popup window
//PopupExtenderID: BehaviorID of the Ajax ModalPopupExtender
 function HideModalPopup(PopupExtenderID){
   var ModalPopWindowHide = $find(PopupExtenderID);
   if (ModalPopWindowHide) {
        ModalPopWindowHide.hide();
    }
 }