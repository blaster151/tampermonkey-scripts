// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.hulu.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    let videoTypes: { name: string, videoSelector: string }[] = [
        { name: 'Hulu', videoSelector: '.content-player' },
        { name: 'Amazon', videoSelector: '.webPlayerContainer' },
        { name: 'Netflix', videoSelector: '.VideoContainer' },
        { name: 'Pluralsight', videoSelector: '#video-container' }
    ];

    let videoType: { name: string, videoSelector: string } = null;
    videoTypes.forEach(vt => {
        console.log('jb', location.href, location, location.hostname);
        if (location.hostname.indexOf(vt.name.toLowerCase()) > 0)
            videoType = vt;
    });

    console.log('video type found - ', videoType.name);

    function addSpeedLabel() {
        var speedLabel = document.createElement('div');
        speedLabel.id = 'playbackSpeed';
        (<any>speedLabel).style = 'position: absolute; top: 5px; left: 5px; z-index: 999; background: transparent; color: white; height: 20px; width: 100px;';
        speedLabel.textContent = 'Hi';

        // $("<div id='playbackSpeed' style='position: absolute; top: 5px; left: 5px; z-index: 999; background: transparent; color: white; height: 20px; width: 100px;'>Hi</div>");
        // document.querySelector("body").prepend(speedLabel);
        if (document.querySelector(videoType.videoSelector))
            (<any>document.querySelector(videoType.videoSelector)).prepend(speedLabel);
        else
            console.log('.VideoContainer not found');

    }

    function updateSpeed(v, newSpeed) {
        v.playbackRate = newSpeed;

        document.getElementById("playbackSpeed").textContent = 'Speed is ' + v.playbackRate;

        console.log('Playback speed updated to ', v.playbackRate);

    }

    console.log('registering wheel listener');
    function registerWheelListener() {
        document.addEventListener('wheel', function(e) {
            if (e.ctrlKey)
            {
                var changeRate = 0.1;

                if (e.deltaY > 0)
                    changeRate = -0.1;

                let nodes = Array.prototype.slice.call(document.querySelectorAll('video'),0);
                nodes.forEach(function (v, i) {
                    console.log('in video qsa', i);
                    var newPlaybackRate = (v.playbackRate + changeRate).toFixed(1);

                    if (true)//(i == 1)
                    {
                        updateSpeed(v, newPlaybackRate);
                    }
                });

                // Go to full screen
                // $('.full-screen-button').click();

                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    }

    function initializeVideoElements() {
        var standardPlaybackRate = 1.7;
        var adPlaybackRate = 100;

        let nodes = Array.prototype.slice.call(document.querySelectorAll('video'),0);

        nodes.forEach(function (v, i) {
            console.log('video frame found ', i, v);
            v.onloadeddata = function() {
                console.log("Browser has loaded the current frame", i, v, v.duration);

                if (v.id.indexOf('content') == 0)
                {
//                    v.playbackRate = standardPlaybackRate;
                    updateSpeed(v, standardPlaybackRate);

                }
                else if (v.id.indexOf('ad') == 0 || v.id.indexOf('intro') == 0) {
                    console.log('duration', v.duration, v.readyState, v.currentTime);
                    var minutes = parseInt(<any>(v.duration / 60), 10);
                    var seconds = v.duration % 60;

                    setTimeout(function() {
                        console.log('setting position to ', v.duration - 5.0);
                        v.currentTime = v.duration - 5.0;
                        //v.playbackRate = adPlaybackRate;
                        updateSpeed(v, adPlaybackRate);

                        console.log('currentTime', v.currentTime);
                    }, 500);

                    //updateSpeed(adPlaybackRate);
                    (<any>document.querySelector('.ad-container')).style = "display: none";
                }
                else
                    console.log('Video id not matched', v.id);

                console.log('Playback rate set to ', v.playbackRate);
            };

            v.onloadedmetadata = function(m) {
                console.log('loaded metadata ', m);
            };
        });

        console.log('Video elements initialized', document.querySelectorAll('video').length);

        setTimeout(        addSpeedLabel, 3500);
        setTimeout(        registerWheelListener, 3500);
    }
    // Your code here...
    console.log('Hulu page loaded');

    setTimeout(initializeVideoElements, 1500);

    setTimeout(function() {
        let nodes = Array.prototype.slice.call(document.querySelectorAll('.smartstart-thumb'),0);
        
        console.log(nodes.length, ' thumbnails found');

        nodes.forEach(tu => tu.addEventListener('click', function(t) {
            console.log('Thumbnail clicked');

            setTimeout(initializeVideoElements, 1500);
        }));
    }, 3000);

})();