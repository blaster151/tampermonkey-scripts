// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.brainscape.com/decks/6134596/review
// @grant        none
// ==/UserScript==

// declare let $: any;

;
(function () {
    'use strict'
    console.log('very top of Reddit Comment Expander');

    var speedLabel;
    var commentsRemainingLabel;

    let feedScrolls = 10;
    let feedScrollInterval = 6000;

    let commentsThreshold = 100;
    let hoursAgoThreshold = 3;

    function scrollFeed(feedScrolls) {
        console.log('at top of scrollFeed');
        let scrollCtr = 0;
        let interval = setInterval(function() {
            window.scrollTo(0,document.body.scrollHeight + 500);

            setTimeout(function() {
                window.scrollTo(0,0);
                scrollCtr++;

                if (scrollCtr >= feedScrolls)
                    clearInterval(interval);
            }, 500);
        }, feedScrollInterval);
    }

    loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.js',
        function () {
            console.log('jQuery loaded; preparing');

            let isPost = window.location.href.indexOf('/comments/') >= 0;
            let startProcessingPage;
            if (isPost)
                startProcessingPage = commentsPageController;
            else
                startProcessingPage = feedController;

            function commentsPageController() {
                console.log('Is post');
                addCommentsRemainingLabel();

                loadMoreComments();
            }

            function feedController() {
                console.log('Is feed');
                suppressFluff();

                addFeedPanel();

                scrollFeed(feedScrolls);
            }

            setTimeout(function () {
                startProcessingPage();
            }, 3000);
        }
    )

    function addPostCloseButtons() {
        $('.scrollerItem').each(function(i, el) {
            if ($(el).find('.btn-close').length == 0)
            {
                var closeBtn = $('<div class="btn-close" style="font-size: 8px; position: absolute; bottom: 8%; right: 1%;">Close</div>');
                closeBtn.click(function(e) { $(el).remove(); e.preventDefault(); return false; });
                $(el).append(closeBtn);
            }
        });
    }

    function suppressFluff() {
        addPostCloseButtons();//Inefficiently processing all previously added posts too

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
                    commentCount < commentsThreshold ||
                    postedAgo <= hoursAgoThreshold
                );
            })
            .each((index, post) => {
                $(post).remove();
            })

        // Remove promoted links
        $('.promotedlink').remove();

        // Hide Google ad images
        $('#google_center_div').remove();
    }

    function getEligibleCommentLinks(commentsThreshold) {
        let totalCommentsCount = 0;
        var matches = $('div[id^=moreComments] div p')
        .each(function(i, x) {
            var s = x.innerText; // .substring(20);
            var c = s.substring(0, s.indexOf(' '));

            x.commentsCount = Number(c);
        })
        .filter(function (i, x) {
            return x.commentsCount >= commentsThreshold;
        })
        .each(function(i, x) {
            totalCommentsCount += x.commentsCount;
        });

        console.log('total comments remaining', totalCommentsCount);
        commentsRemainingLabel.innerHTML = totalCommentsCount.toString();

        matches = matches.filter(function (i, x) {
            // console.log('in eval', x, $(x).text());
            return $(x).text() != 'loading...';
        });

        matches = matches.sort(sort_li); // sort elements
        // sort function callback
        function sort_li(a, b) {
            var s = a.innerText; // .substring(20);
            var c = s.substring(0, s.indexOf(' '));

            var s2 = b.innerText; // .substring(20);
            var c2 = s2.substring(0, s2.indexOf(' '));

            return parseInt(c.replace(',', '')) < parseInt(c2.replace(',', '')) ? 1 : -1;
        }

        return matches;
    }

    function loadMoreComments() {
        var incr = 0
        var commentsThreshold = 3

        var eligibleCommentLinks = getEligibleCommentLinks(commentsThreshold);
        console.log('eligible comments links', eligibleCommentLinks.length);
        if (eligibleCommentLinks.length === 0) {
            setTimeout(function () {
                eligibleCommentLinks = getEligibleCommentLinks(commentsThreshold)

                if (eligibleCommentLinks.length == 0) {
                    console.log('No more comments detected after 3 seconds');

                    commentsRemainingLabel.parentNode.removeChild(commentsRemainingLabel);

                    addSpeedLabel();
                    document.title = '*' + document.title;

                    // Hide advertisement sidebar
                    $("div[id|=sidebar]").remove();
                } else {
                    console.log('Detected more comments');
                    loadMoreComments();
                }
            }, 3000);
        } else {
            var x = eligibleCommentLinks.first()[0];

            // First match only
            console.log('Expanding comments ', x.innerText);
            x.click();
        }
    }

    function addSpeedLabel() {
        speedLabel = document.createElement('button');
        speedLabel.id = 'btnViewAll';
        speedLabel.style = 'position: fixed; top: 5px; left: 5px; z-index: 999; background: white; border: 2px solid orange; z-index: 9999999999; color: black; height: 20px; width: 100px; padding-top: 5px; border-radius: 10px; opacity: .75; font-weight: bold; margin-left: 41px;';
        speedLabel.textContent = 'View All';

        speedLabel.addEventListener('click', function () {
            scrollToBottom();
        });

        (<any>document.body).prepend(speedLabel);
    }

    function addCommentsRemainingLabel() {
        commentsRemainingLabel = document.createElement('span');
        commentsRemainingLabel.id = 'commentsRemaining';
        commentsRemainingLabel.style = 'position: fixed; top: 5px; left: 5px; z-index: 999; background: white; border: 2px solid orange; z-index: 9999999999; color: black; height: 20px; width: 50px; padding-top: 5px; border-radius: 10px; opacity: .75; font-weight: bold; margin-left: 41px;';
        commentsRemainingLabel.textContent = '?';

        (<any>document.body).prepend(commentsRemainingLabel);
    }

    function addFeedPanel() {
        speedLabel = document.createElement('div');
        speedLabel.id = 'feedPanel';
        speedLabel.style = 'position: fixed; top: 5px; left: 5px; z-index: 999; background: white; border: 2px solid orange; z-index: 9999999999; color: black; height: 20px; width: 100px; padding-top: 5px; border-radius: 10px; opacity: .75; font-weight: bold; margin-left: 41px;';
        speedLabel.textContent = '(feed+)';

        var btnScrollMore = $('<button>Scroll More</button>');
        btnScrollMore.click(function() { scrollFeed(feedScrolls); });
        $(speedLabel).append(btnScrollMore);

        $(<any>document.body).prepend(speedLabel);
    }

    function loadScript(url, callback) {
        var script: any = document.createElement('script');
        script.type = 'text/javascript';

        if (script.readyState) {
            // IE
            script.onreadystatechange = function () {
                if (script.readyState == 'loaded' || script.readyState == 'complete') {
                    script.onreadystatechange = null;
                    callback();
                }
            }
        } else {
            // Others
            script.onload = function () {
                callback();
            }
        }

        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    function scrollToBottom() {
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




    var ajaxDelay = 200;

    var s_ajaxListener: any = new Object()
    s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open;
    s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;
    s_ajaxListener.callback = function () {
        //    console.log('in ajax callback', this.method, this.url, this.data);

        if (this.method == 'POST' && this.url == 'https://www.reddit.com') {
            console.log('reddit ajax complete');

            setTimeout(function() {
                suppressFluff();
            }, 50);
        }
        if (this.method == 'POST' && this.url.indexOf('morecomments') >= 0) {
            console.log(
                'morecomments ajax complete; calling loadMoreComments again',
                ajaxDelay
            );

            setTimeout(function () {
                loadMoreComments();
            }, ajaxDelay);
        }

        if (this.method == 'POST' && this.url.indexOf('/timings/mount ') >= 0) {
            ajaxDelay += 50
            console.log(
                'timing - requested too soon; increasing ajaxDelay to ',
                ajaxDelay
            )

            // We asked for a refresh too soon
            setTimeout(function () {
                loadMoreComments();
            }, ajaxDelay)
        }

        // this.method :the ajax method used
        // this.url    :the url of the requested script (including query string, if any) (urlencoded)
        // this.data   :the data sent, if any ex: foo=bar&a=b (urlencoded)
    }

    XMLHttpRequest.prototype.open = function (a, b) {
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

    let proto: any = XMLHttpRequest.prototype;
    proto.send = function (a, b) {
        if (!a) a = '';
        if (!b) b = '';
        s_ajaxListener.tempSend.apply(this, arguments)
        if (s_ajaxListener.method.toLowerCase() == 'post') s_ajaxListener.data = a
        s_ajaxListener.callback();
    }
})();
