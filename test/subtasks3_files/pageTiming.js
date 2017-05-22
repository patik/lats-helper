try {

    var timing = performance.timing;

    $(window).load(function () {
        setTimeout(function () {
            var latency = getLatency();
            var pageLoad = getPageLoadTime();
            var totalTime = getTotalTime();
            var domLoadTime = getDOMLoadTime();
            var dnsLookup = getDNSLookupTime();
            var tcpConnectTime = getTCPConnectionTime();
            var documentTransferTime = getDocumentTransferTime();
            var redirectTime = getRedirectTime();

            var plugins = navigator["plugins"];
            var plugInList = '';
            for (var i = 0; i < plugins.length; i++) {
                plugInList = plugInList + ' ' + plugins[i].name + ': ' + plugins[i].description;
            }

            var trackingData = {
                TotalTime: totalTime,
                Latency: latency,
                PageLoad: pageLoad,
                DOMLoad: domLoadTime,
                DNSLookup: dnsLookup,
                TCPConnect: tcpConnectTime,
                DocumentXferTime: documentTransferTime,
                RedirectTime: redirectTime,
                Browser: navigator["appName"],
                AppCodeName: navigator["appCodeName"],
                AppMinorVersion: navigator["appMinorVersion"],
                CPUClass: navigator["cpuClass"],
                Platform: navigator["platform"],
                Plugins: plugInList,
                OpsProfile: navigator["opsProfile"],
                UserProfile: navigator["userProfile"],
                SystemLanguage: navigator["systemLanguage"],
                UserLanguage: navigator["userLanguage"],
                AppVersion: navigator["appVersion"],
                UserAgent: navigator["userAgent"],
                OnLine: navigator["onLine"],
                CookieEnabled: 'N/A',
                URL: window.location.href,
                PriorURL: document.referrer
            };

            var root = $("[id$=rootURL]")[0].value;
            var data2Send = JSON.stringify({ "td": trackingData });
            $.ajaxSetup({ type: 'POST', dataType: 'json', async: true, contentType: 'application/json', data: {} });

            $.ajax({
                url: root + "WebServices/Utilities.asmx/WritePageTracking",
                data: data2Send,
                success: function (result) {
                    // do nothing.
                },
                error: function (result) {
                    // do nothing.
                }
            });

        }, 0);
    });
} catch (err) {
    // do we need to do anything w/the error?
}

function getDocumentTransferTime() {
    var returnVal = 0;
    var respStart = timing.responseStart;
    var respEnd = timing.responseEnd;

    if ((respStart != 0) && (respEnd != 0)) {
        returnVal = (respEnd - respStart) / 1000;
    }

    return returnVal;
}

function getDOMLoadTime() {
    var returnVal = 0;
    var domEnd = timing.domContentLoadedEventEnd;
    var domStart = timing.domContentLoadedEventStart;

    if ((domEnd != 0) && (domStart != 0)) {
        returnVal = (domEnd - domStart) / 1000;
    }

    return returnVal;
}

function getDNSLookupTime() {
    var returnVal = 0;
    var navStart = timing.navigationStart;
    var dnsStart = timing.domainLookupStart;
    var dnsEnd = timing.domainLookupEnd;

    if ((navStart != 0) && (dnsStart != 0) && (dnsEnd != 0)) {
        returnVal = ((dnsEnd - navStart) - (dnsStart - navStart)) / 1000;
    }

    return returnVal;
}

function getLatency() {
    var returnVal = 0;
    var respEnd = timing.responseEnd;
    var fetStart = timing.fetchStart;

    if ((respEnd != 0) && (fetStart != 0)) {
        returnVal = (respEnd - fetStart) / 1000;
    }

    return returnVal;
}

function getPageLoadTime() {
    var returnVal = 0;
    var loadEnd = timing.loadEventEnd;
    var respStart = timing.responseStart;

    if ((loadEnd != 0) && (respStart != 0)) {
        returnVal = (loadEnd - respStart) / 1000;
    }

    return returnVal;
}

function getRedirectTime() {
    var returnVal = 0;
    var redStart = timing.redirectStart;
    var redEnd = timing.redirectEnd;

    if ((redStart != 0) && (redEnd != 0)) {
        returnVal = (redEnd - redStart) / 1000;
    }

    return returnVal;
}

function getTCPConnectionTime() {
    var returnVal = 0;
    var navStart = timing.navigationStart;
    var tcpStart = timing.connectStart;
    var tcpEnd = timing.connectEnd;

    if ((navStart != 0) && (tcpStart != 0) && (tcpEnd != 0)) {
        returnVal = ((tcpEnd - navStart) - (tcpStart - navStart)) / 1000;
    }

    return returnVal;
}

function getTotalTime() {
    var returnVal = 0;
    var loadEnd = timing.loadEventEnd;
    var navStart = timing.navigationStart;

    if ((loadEnd != 0) && (navStart != 0)) {
        returnVal = (loadEnd - navStart) / 1000;
    }

    return returnVal;
}

function showTimings() {
    try {

        $("[id$=cellNavigationStartValue]").text(timing.navigationStart);
        $("[id$=cellRedirectStartValue]").text(timing.redirectStart);
        $("[id$=cellUnloadEventStartValue]").text(timing.unloadEventStart);
        $("[id$=cellUnloadEventEndValue]").text(timing.unloadEventEnd);
        $("[id$=cellRedirectEndValue]").text(timing.redirectEnd);
        $("[id$=cellFetchStartValue]").text(timing.fetchStart);
        $("[id$=cellDomainLookupStartValue]").text(timing.domainLookupStart);
        $("[id$=cellDomainLookupEndValue]").text(timing.domainLookupEnd);
        $("[id$=cellConnectStartValue]").text(timing.connectStart);
        $("[id$=cellConnectEndValue]").text(timing.connectStart);
        $("[id$=cellRequestStartValue]").text(timing.requestStart);
        $("[id$=cellResponseStartValue]").text(timing.responseStart);
        $("[id$=cellResponseEndValue]").text(timing.responseEnd);
        $("[id$=cellDOMLoadingValue]").text(timing.domLoading);
        $("[id$=cellDOMInteractiveValue]").text(timing.domInteractive);
        $("[id$=cellDOMContentLoadedEventStartValue]").text(timing.domContentLoadedEventStart);
        $("[id$=cellDOMContentLoadedEventEndValue]").text(timing.domContentLoadedEventEnd);
        $("[id$=cellDOMCompleteValue]").text(timing.domComplete);
        $("[id$=cellLoadEventStartValue]").text(timing.loadEventStart);
        $("[id$=cellLoadEventEndValue]").text(timing.loadEventEnd);
        $("[id$=cellMSFirstPaintValue]").text(timing.msFirstPaint);
        $("[id$=cellNavigationStartValue]").text('foo!');
    } catch (err) {
        // do nothing.
    }
}