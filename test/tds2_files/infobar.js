// modified from original version found here: http://www.dotnetbips.com/articles/bbf0b5e4-1d4d-46e2-b30d-f71c659e3e10.aspx

(function ($) {
    
    //infobar plugin
    $.fn.InfoBar = function (params) {
        //store div element reference for future use
        var bar = $(this);

        //infobar options
        var options = {
            'CssClass': 'InfoBar', 'CloseButtonId':
                        'InfoBarButton', 'CookieName': 'ShowInfoBar'
        };
        if (params) {
            $.extend(options, params);
        }

        //handle scroll event of window to keep infobar always visible
        $(window).scroll(function () {
            if ($("[id$=hdnNotificationID]")[0].value != "") {
                $(bar).css("display", 'none');
                $(bar).css("marginTop", $(window).scrollTop());
                $(bar).css("display", 'block');
            }
        });

        //hide infobar if user has previously clicked close button or there is no message to display
        if ($("[id$=hdnNotificationID]")[0].value == "") {
            $(bar).css('display', 'none');
            return;
        }

        //store a cookie to indicate that user has clicked close button
        $("#" + options.CloseButtonId).click(function (e) {
            $(bar).slideUp('slow');
            e.preventDefault();
        });

        //display infobar and apply CSS class
        return this.each(function () {
            if ($("[id$=hdnNotificationID]")[0].value != "") {
                $(bar).addClass(options.CssClass);
                $(bar).css('display', 'block');
            }
        });
    }
})(jQuery);

