// modified from original version found here: http://www.dotnetbips.com/articles/bbf0b5e4-1d4d-46e2-b30d-f71c659e3e10.aspx

(function ($) {

    //infobar plugin
    $.fn.Notification = function (message, siteRoot, params) {
        // don't show on child windows
        var windowName = window.name.toLowerCase();
        if (windowName.indexOf("lats") >= 0 || windowName.indexOf("time_") >= 0 || windowName.indexOf("_time") >= 0) {
           
            //store div element reference for future use
            var bar = $(this);
            var htmlMessage = "<table cellpadding='10' width='100%' border='0'><tr><td align='center' width='95%'>" + message + "&nbsp; <a href='" + siteRoot + "dashboard?goHome=true'><img alt='Back to Home Site' title='Back to Home Site' src='" + siteRoot + "images/home.png'/></td></tr></table>";
            bar.html(htmlMessage);

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
                $(bar).css("display", 'none');
                $(bar).css("marginTop", $(window).scrollTop());
                $(bar).css("display", 'block');
            });

            //store a cookie to indicate that user has clicked close button
            $("#" + options.CloseButtonId).click(function (e) {
                $(bar).slideUp('slow');
                e.preventDefault();
            });

            //display notification bar and apply CSS class
            return this.each(function () {
                $(bar).addClass(options.CssClass);
                $(bar).css('display', 'block');
            });
        }
    }
    
})(jQuery);

