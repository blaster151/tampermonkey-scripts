// ==UserScript==
// @name         Disqus Home
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://disqus.com/home/*
// @require https://cdn.firebase.com/js/client/2.2.3/firebase.js
// @grant        none
// ==/UserScript==

declare let Firebase: any;

(function () {
    'use strict';

    // Your code here...
    console.log('Disqus home', location.href);




    
    var ref = new Firebase("https://jeff-test1.firebaseio.com/disqus2/articles");
    var existingArticles;
    ref.on('value', function(snapshot) {
        existingArticles = (<any>Object).values(snapshot.val());
        console.log('got value', existingArticles);

        if (existingArticles.some((a) => a.url == window.location.href))
        {
            console.log('This article has been read before', window.location.href);
        }
    });





    if (location.href.indexOf('/embed/comments') >= 0) {
        console.log('Inside iframe');
    }

    // todo - hook into http event completion

    let commentsThreshold = 250;

    function skimLowActivityPosts() {
        console.log('skimming');
        (<any>document.querySelectorAll(".label--count")).forEach((el) => {
            console.log(el.innerText);
            if (parseInt(el.innerText) < commentsThreshold) el.closest('.card-wrap').remove()
        });
    }

    function clickMoreButton() {
        console.log('More button');
        document.querySelector('.more-wrapper button').dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          }));
    }

    setTimeout(() => {
        console.log('after initial delay');

        console.log('outside iframe');
        window.scrollTo(0, document.body.scrollHeight);

        setTimeout(() => {
            var commentsSrc = getCommentsIFrame().src;
            console.log('commentsSrc', commentsSrc);

            $.ajax(commentsSrc, {
                complete: function (e) {
                    console.log('Completed our own ajax call');
                    var responseText = e.responseText;

                    var responseText2 = responseText.substring(responseText.indexOf('<body'));
                    var responseText3 = responseText2.substring(0, responseText2.indexOf('</body>') + 7);

                    var parsedResponseAsJquery = $(responseText3);

                    // Modify the parsed contents
                    var disqusStartupScriptTag = getScriptTag(parsedResponseAsJquery);
                    disqusStartupScriptTag.innerText = disqusStartupScriptTag.innerText
                        .replace('http-equiv', 'abc1')
                        .replace('content', 'abc2');
                    console.log('disqusStartupScriptTag', disqusStartupScriptTag);



                    var jsonContent = getContentAsJson(parsedResponseAsJquery);
                    console.log('jsonContent', jsonContent);
                    console.log('thread id ', jsonContent.response.thread.id);
                    var threadId = jsonContent.response.thread.id;
                    var comments = jsonContent.response.posts;
                    var cursor = 0;

                    function evaluateWhetherNextPageAvailable(jsonContent) {
                        if (jsonContent.cursor.hasNext) {
                            cursor++;

                            console.log('Loading next page', cursor);

                            $.ajax('https://disqus.com/api/3.0/threads/listPostsThreaded?limit=50&thread=' + threadId + '&forum=channel-breakingnews&order=popular&cursor=' + cursor + '%3A0%3A0&api_key=E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F', {
                                complete: (e) => {
                                    console.log('complete', e.responseJSON);
                                    jsonContent = e.responseJSON;
                                    comments = comments.concat(jsonContent.response);

                                    evaluateWhetherNextPageAvailable(jsonContent);
                                },
                                error: (e) => {
                                    console.log('error ', e);
                                }
                            });
                        } else {
                            console.log('Completed');
                            console.log(comments.length);
                            console.log(comments);

                            displayComments(comments);

                            console.log('ABOUT TO SET VALUE', window.location.href);
                            
                            var ref = new Firebase("https://jeff-test1.firebaseio.com/disqus2/articles");
                            //ref.set(window.location.href);
                            ref.push({ url: window.location.href }, function(error) {
                                if (error) {
                                    console.log('push failed');
                                    
                                  // The write failed...
                                } else {
                                    console.log('push succeeded');
                                    
                                  // Data saved successfully!
                                }
                              });
                        }
                    };

                    // First page
                    evaluateWhetherNextPageAvailable(jsonContent);
                },
                error: function (e) {
                    console.log('Error ', e);
                }
            });

            skimLowActivityPosts();
            suppressAlreadyReadPosts();
            clickMoreButton();
        }, 1000);

    }, 5000);

    function getCommentsIFrame() {
        // Seems very hacky and like it wouldn't work right on all pages; is there a better way?
        // Can we iterate through the iframes and find the one with the most appropriate src?
        return $('iframe').filter(function (i, el) {
            console.log('iframe found', el.src);
            return el.src.indexOf('comments') >= 0;
        })[0];
    }

    function getScriptTag(parsedResponseAsJquery) {
        var result = parsedResponseAsJquery.filter(function (i, el) {
            return el.nodeName == 'SCRIPT';
        })[3]; // Also seems hacky to hardwire this magic number

        console.log('Isolated script ', result);
        return result;
    }

    function getContentAsJson(parsedResponseAsJquery) {
        var result = parsedResponseAsJquery.filter(function (i, el) {
            return el.nodeName == 'SCRIPT' && el.id == 'disqus-threadData';
        })[0];

        return JSON.parse($(result).text());
    }

    function displayComments(comments) {
        console.log('in displayComments');

        var ourContent = $(
            "<div id='ourContent'></div>"
        );

        $('body').empty();
        $('body').append($('<style type="text/css">div p { margin-bottom: .5em } .comment { border: 1px gray solid; margin: 1em; background: white; border-radius: .25em; border-color: transparent; padding: .5em .5em .1em; } .childLevel1 { padding-left: 2.5em } .childLevel2 { padding-left: 4.5em }</style>'));
        $('body').append(ourContent);

        // Is it too soon to add a View All button?
        addSpeedLabel();

        comments.filter(element => {
                return element.parent === null;
            })
            .forEach(element => {
                console.log('printing root level post ', element);
                ourContent.append($("<div class='comment'>" + element.message + "</div>"));

                displayChildren(element.id, comments, ourContent, 1);
            });

        window.scrollTo(0, 0);
    }

    function displayChildren(parentId, comments, ourContent, childLevel) {
        comments.filter(childElement => childElement.parent == parentId).forEach(childElement => {
            console.log('printing child level post ', childLevel);

            ourContent.append($("<div class='comment childLevel" + childLevel + "'>" + childElement.message + "</div>"));

            // Recurse
            displayChildren(childElement.id, comments, ourContent, childLevel++);
        });
    }
















    let speedLabel = null;
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

            let ourContent = document.querySelector('#ourContent');

            if ((window.innerHeight + window.scrollY) >= (<any>ourContent).offsetHeight) {
                // you're at the bottom of the page
                clearInterval(scrollIntervalHandle);
                console.log('Reached the bottom');
            }
        }, 50);
    }

    function suppressAlreadyReadPosts() {
        console.log('top of suppressAlreadyReadPosts; articles already read', existingArticles);

        //$("$(".discussion-title a").length").length
        var matchingLinks = (<any>document.querySelectorAll("li a[data-link-name=view_discussion]")); //(".discussion-title a"));
        console.log('matchingLinks count ', matchingLinks.length);
        
        (<any>document.querySelectorAll("li a[data-link-name=view_discussion]")).forEach((el) => {
            var segments = $(el).attr('href').split('/').filter(str => str.length > 0);
            var lastSegment = segments[segments.length - 1];
            
            if (existingArticles.some((a) => {
                var Asegments = a.url.split('/').filter(str => str.length > 0);
                var lastASegment = Asegments[Asegments.length - 1];
    
                return lastASegment == lastSegment;
            }))
            {
                console.log('Suppressing already-read article', $(el).attr('href'));
                
                $(el).closest('.card-wrap').remove();
            }
            else {
                console.log('No match found for ', $(el).attr('href'));
            }
        });
    }


    var ajaxDelay = 200;

    var s_ajaxListener: any = new Object()
    s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open;
    s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;
    s_ajaxListener.callback = function () {
        // console.log('in ajax callback', this.method, this.url, this.data);

        if (this.method == 'GET' && this.url.indexOf('https://disqus.com/api/3.0/timelines/activities?type=home') >= 0) {
            setTimeout(function () {
                skimLowActivityPosts();

                suppressAlreadyReadPosts();
            }, 1000);
        }

        // this.method :the ajax method used
        // this.url    :the url of the requested script (including query string, if any) (urlencoded)
        // this.data   :the data sent, if any ex: foo=bar&a=b (urlencoded)
    };

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
    };

    let proto: any = XMLHttpRequest.prototype;
    proto.send = function (a, b) {
        if (!a) a = '';
        if (!b) b = '';
        s_ajaxListener.tempSend.apply(this, arguments)
        if (s_ajaxListener.method.toLowerCase() == 'post') s_ajaxListener.data = a
        s_ajaxListener.callback();
    };















    let firebaseSettings = {
        apiKey: 'AIzaSyBwclMUsqdXdadQCsMr4i7vJPSuu3-TaXW',
        authDomain: 'starwarsdestiny-eedf3.firebaseapp.com',
        databaseURL: 'https://starwarsdestiny-eedf3.firebaseio.com',
        projectId: 'starwarsdestiny-eedf3',
        storageBucket: 'starwarsdestiny-eedf3.appspot.com',
        messagingSenderId: '676214572815'
      };

//    var ref = new Firebase("https://jeff-test1.firebaseio.com/learner/lastName");
    // ref.on('value', function(snapshot) {
    //     console.log('got value', snapshot.val());
    // });
})();
