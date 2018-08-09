// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/playlist?list=PLfWKIkvwpw_oseLi7nrcUXPqcuyZuPVOi
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Your code here...
    console.log('Youtube playlist opened');
    const continueLinks = document.querySelectorAll('.yt-next-continuation');
    Array.prototype.forEach.call(continueLinks, function (node: HTMLElement) {
        node.click();
        // Your code here.
    });

    document.addEventListener('keypress', k => {
        if (k.key === 'r') {
            var videos = document.querySelectorAll('.ytd-two-column-browse-results-renderer .ytd-playlist-video-renderer a#thumbnail');
            console.log('Videos found: ', videos.length);

            Array.prototype.forEach.call(videos, function (node: HTMLElement) {
                node.click();
                // Your code here.
            });

            var randomVideo = <HTMLElement>videos[Math.floor(Math.random() * videos.length)];
            console.log(randomVideo);

            randomVideo.click();
        }
    });
})();