declare let GM_xmlhttpRequest: any;

// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.hulu.com/
// @grant        GM_xmlhttpRequest
// @connect localhost
// ==/UserScript==

(function () {
    'use strict';

    GM_xmlhttpRequest({
        method: "GET",
        url: "http://localhost:3000/files",
        onload: function(response) {
          console.log(response.responseText);
        }
      });

    let videoTypes: { name: string, videoSelector: string, videoElementId?: string, color: string }[] = [
        { name: 'Hulu', videoSelector: '.content-player', color: 'white' },
        { name: 'Amazon', videoSelector: '.webPlayerContainer', color: 'white' },
        { name: 'Netflix', videoSelector: '.VideoContainer', color: 'white' },
        { name: 'Pluralsight', videoSelector: '#video-container', color: 'white' },
        { name: 'Youtube', videoSelector: '.html5-video-container', color: 'black' },
        { name: 'Coursera', videoSelector: '.video-container', videoElementId: 'c-video_html5_api', color: 'black' }
    ];

    let videoType: { name: string, videoSelector: string, videoElementId?: string } = null;
    videoTypes.forEach(vt => {
        if (location.hostname.indexOf(vt.name.toLowerCase()) > 0)
            videoType = vt;
    });

    console.log('video type found - ', videoType.name);

    function addSpeedLabel() {
        var speedLabel = document.createElement('div');
        speedLabel.id = 'playbackSpeed';
        (<any>speedLabel).style = 'position: fixed; top: 5px; left: 5px; z-index: 999; background: white; border: 2px solid orange; z-index: 9999999999; color: black; height: 20px; width: 100px; padding-top: 5px; border-radius: 10px; opacity: .75; font-weight: bold; margin-left: 41px;';
        speedLabel.textContent = 'Loading';

        // $("<div id='playbackSpeed' style='position: absolute; top: 5px; left: 5px; z-index: 999; background: transparent; color: white; height: 20px; width: 100px;'>Hi</div>");
        // document.querySelector("body").prepend(speedLabel);
        if (document.querySelector(videoType.videoSelector))
            (<any>document.body).prepend(speedLabel);
        else
            console.error('.VideoContainer not found');
    }

    function updateSpeed(v, newSpeed) {
        v.playbackRate = newSpeed;

        document.getElementById("playbackSpeed").textContent = v.playbackRate + 'x';

        console.log('Playback speed updated to ', v.playbackRate);
    }

    console.log('registering wheel listener');
    function registerWheelListener() {
        document.addEventListener("wheel", function (e) {
            if (e.ctrlKey) {
                var changeRate = 0.1;

                if (e.deltaY > 0)
                    changeRate = -0.1;

                let nodes = Array.prototype.slice.call(document.querySelectorAll('video'), 0);
                nodes.forEach(function (v, i) {
                    var newPlaybackRate = (v.playbackRate + changeRate).toFixed(1);

                    if (true)// (i == 1)
                    {
                        updateSpeed(v, newPlaybackRate);
                    }
                });

                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    }

    function waitFor(selector: string) {
        return new Promise((res, rej) => {
            waitForElementToDisplay(selector, 200);

            function waitForElementToDisplay(selector: string, time: number) {
                if (document.querySelector(selector) != null) {
                    res(document.querySelector(selector));
                }
                else {
                    setTimeout(function () {
                        waitForElementToDisplay(selector, time);
                    }, time);
                }
            }
        });
    }

    var lastPlaybackRate = 0.0;
    function initializeVideoElements() {
        var standardPlaybackRate = 1.7;
        var adPlaybackRate = 100;
        console.log('video element found: ', document.querySelectorAll("video"));

        waitFor("video").then(rsp => {
            console.log('video element found');

            let nodes = Array.prototype.slice.call(document.querySelectorAll("video"), 0);

            nodes.forEach(function (v, i) {
                console.log("video frame found ", i, v);
                v.onloadeddata = function () {
                    console.log("Browser has loaded the current frame", i, v, v.duration);

                    if (v.id.indexOf("content") == 0) {
                        updateSpeed(v, standardPlaybackRate);
                    }
                    else if (v.classList.contains("html5-main-video")) {
                        console.log('youtube video detected by class');
                        updateSpeed(v, standardPlaybackRate);
                    }
                    else if (v.id.indexOf("ad") == 0 || v.id.indexOf("intro") == 0) {
                        var minutes = parseInt(<any>(v.duration / 60), 10);
                        var seconds = v.duration % 60;

                        setTimeout(function () {
                            console.log("setting position to ", v.duration - 5.0);
                            v.currentTime = v.duration - 5.0;
                            updateSpeed(v, adPlaybackRate);
                        }, 500);

                        (<any>document.querySelector(".ad-container")).style = "display: none";
                    }
                    else if (v.id === videoType.videoElementId)
                    {
                        console.log('Matched video type element');
                        updateSpeed(v, standardPlaybackRate);
                    }
                    else
                        console.error("Video id not matched", v.id);

                    lastPlaybackRate = v.playbackRate;
                    console.log("Playback rate set to ", v.playbackRate);
                };

                v.onloadedmetadata = function (m) {
                    console.log("loaded metadata ", m);
                };
            });

            console.log("Video elements initialized", document.querySelectorAll("video").length);

        });

        console.log("wait for ", videoType.videoSelector);
        waitFor(videoType.videoSelector).then(rsp => {
            console.log("waitFor succeeded for videoselector", videoType.videoSelector);
            addSpeedLabel();
            registerWheelListener();
        });
    }
    // your code here...
    console.log("Video page loaded");

    initializeVideoElements();

    setTimeout(function () {
        let nodes = Array.prototype.slice.call(document.querySelectorAll(".smartstart-thumb"), 0);

        console.log(nodes.length, " thumbnails found");

        nodes.forEach(tu => tu.addEventListener("click", function (t) {
            console.log("Thumbnail clicked");

            setTimeout(initializeVideoElements, 1500);
        }));
    }, 3000);
})();
