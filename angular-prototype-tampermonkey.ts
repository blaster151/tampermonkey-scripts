// ==UserScript==
// @name         Add Angular
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.reddit.com
// @match        https://www.reddit.com/*
// @match        https://disqus.com/home/
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.7.2/angular.js
// @grant        none
// ==/UserScript==

let styles = `
    <style type="text/css">
        #tamperPanel {
            position: fixed;
            top: 5px;
            left: 5px;
            background: white;
            border: 2px solid orange;
            z-index: 9999999999;
            color: black;
            height: 20px;
            width: 340px;
            padding-top: 8px;
            border-radius: 10px;
            opacity: .6;
            font-weight: bold;
            margin-left: 41px;
            padding-left: 7px;
        }

        #tamperPanel:hover {
            opacity: .95;
        }

        #tamperPanel button {
            float: left;
            border: 0px;
            font-size: 14px;
            margin-right: 4em;
        }
    </style>`;
let htmlTemplate = `
    <div ng-cloak ng-app="TampermonkeyApp">
        <div ng-controller="TampermonkeyController">
            <h1>{{greeting}}</h 1>

            <div id='tamperPanel'>
                <div ng-controller="ScrollFeedController">
                    <button ng-click="toggle()">Toggle Infinite Refresh ({{scrollsCtr}})</button>
                </div>

                <div ng-controller="ViewAllController">
                    <button id='viewAllButton' ng-click='scrollToBottom()'>View All</button>
                </div>
            </div>
        </div>
    </div>`;

(function () {
    // Add styles
    $('head').append($(styles));

    $('body').prepend(
        $(htmlTemplate)
    );
})();

angular.module('TampermonkeyApp', [])
.controller('TampermonkeyController', function ($scope, xhrNotificationService, redditPostFilterService) {
    $scope.greeting = "Hello there, world!";
    setInterval(() => {
        $scope.greeting += 'x';
        $scope.$apply();
    }, 1500);

    xhrNotificationService.register((x,y,z) => {
        console.log('Received callback from xhrNotificationService', x, y, z);

        // Every time an AJAX call finishes, suppress stuff from the
        // feed that we don't want
        redditPostFilterService.suppressFluff();
    });
})

.controller('ScrollFeedController', function ($scope) {
    $scope.feedScrollInterval = 1500;
    $scope.scrollingOn = false;

    $scope.toggle = function() {
        console.log('toggling');
        $scope.scrollingOn = !$scope.scrollingOn;
    }

    function scrollFeed(feedScrolls?) {
        $scope.scrollsCtr = 0;
        let interval = setInterval(function() {
            console.log('checking scrollFeed');
            if (!$scope.scrollingOn)
                return;

            $scope.scrollsCtr++;
            window.scrollTo(0,document.body.scrollHeight + 500);

            setTimeout(function() {
                window.scrollTo(0,0);
            }, 100);
        }, $scope.feedScrollInterval);
    }    

    scrollFeed();
})

.controller('ViewAllController', function($scope) {
    $scope.scrollToBottom = function() {
        // Former implementation
        // window.scrollTo({ top: 0 }); setInterval(() => { window.scrollBy({top: 500, left: 0 }); }, 100);

        // Modified former implementation
        var WH = $(window).height()
        window.scrollTo({
            top: 0
        });
        var scrollIntervalHandle = setInterval(() => {
            window.scrollBy({
                top: WH,
                left: 0
            });

                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                    // you're at the bottom of the page
                    clearInterval(scrollIntervalHandle);
                    console.log('Reached the bottom');
                }
        }, 50);
    }
})

.service('xhrNotificationService', function() {
    var self = this;

    let fn: Function = null;

    self.register = function(fn: Function) {
        self.fn = fn;
    }

    var s_ajaxListener: any = new Object()
    s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open;
    s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;
    s_ajaxListener.callback = function () {
        if (self.fn)
            self.fn(this.method, this.url, this.data);
    }

    let proto: any = XMLHttpRequest.prototype;

    proto.open = function (a, b) {
        if (!a) a = '';
        if (!b) b = '';
        s_ajaxListener.tempOpen.apply(this, arguments)
        s_ajaxListener.method = a;
        s_ajaxListener.url = b;
        if (a.toLowerCase() == 'get') {
            s_ajaxListener.data = b.split('?')
            s_ajaxListener.data = s_ajaxListener.data[1]
        }
    }

    proto.send = function (a, b) {
        if (!a) a = '';
        if (!b) b = '';

        console.log('about to ajax ', JSON.stringify(arguments));

        if (this.__raven_xhr)
        {
            console.log(JSON.stringify(this.__raven_xhr));//__raven_xhr.url
        }
        
        s_ajaxListener.tempSend.apply(this, arguments)
        if (s_ajaxListener.method.toLowerCase() == 'post') s_ajaxListener.data = a
        s_ajaxListener.callback();
    }

    return self;
})

.service('redditPostFilterService', function() {
    let self = this;
    
    self.commentsThreshold = 100;
    self.hoursAgoThreshold = 4;

    self.suppressFluff = function () {
        setTimeout(() => {
            suppressPromotedPosts();
            addPostCloseButtons(); //Inefficiently processing all previously added posts too
        }, 250);    // Wait for $

        // Make this not remove comments from an article
        $('.scrollerItem')
            .filter((index, post) => {
                let commentCount = parseInt(
                    $(post)
                    .find("a[data-click-id='comments']")
                    .text()
                    .replace('.', '')
                    .replace('k ', '000')
                    .replace(' comments', '')
                );
                let postedAgo = 0

                let agoText = $(post).find("a[data-click-id='timestamp']").text();

                if (agoText.indexOf('hours') >= 0) {
                    postedAgo = parseInt(agoText.replace(' hours ago', ''));
                } else if (agoText.indexOf('day') >= 0) {
                    postedAgo =
                        24 *
                        parseInt(agoText.replace(' days ago', '').replace(' day ago', ''));
                }

                return (
                    isNaN(commentCount) ||
                    commentCount < self.commentsThreshold ||
                    postedAgo <= self.hoursAgoThreshold
                );
            })
            .each((index, post) => {
                $(post).remove();
            })
    }

    function addPostCloseButtons() {
        $('.scrollerItem').each(function(i, el) {
            if ($(el).find('.btn-close').length == 0)
            {
                var closeBtn = $('<div class="btn-close" style="font-size: 8px; position: absolute; bottom: 8%; right: 1%;">Close</div>');
                closeBtn.click(function(e) { $(el).remove(); e.preventDefault(); return false; });
                // $(el).append(closeBtn);

                var closeAboveBtn = $('<div class="btn-close" style="font-size: 8px; position: absolute; bottom: 8%; right: 1%;">Close Above</div>');
                closeAboveBtn.click(function(e) {
                    var hasReachedClickedElement = false;
                    $('.scrollerItem').each(function(i, el2) {
                        if (hasReachedClickedElement)
                            return;

                        if (el2 == el)
                        {
                            hasReachedClickedElement = true;
                            return;
                        }

                        $(el2).remove();
                    });
                    
                    e.preventDefault(); return false; }
                );

                $(el).append(closeAboveBtn);

                var commentsLink = $(el).find("a[data-click-id='comments']");
                commentsLink.each((i, el) => {
                    $(el).click(function (el) {
                        closeAboveBtn.click();
                    });
                });
            }
        });
    }

    function suppressPromotedPosts() {
        $('.promotedLink, .promotedSpan, span:contains(promoted)')
            .closest('.scrollerItem')
            .remove();
    }

    return self;
});