// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/playlist?list=PLfWKIkvwpw_oseLi7nrcUXPqcuyZuPVOi
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    console.log('Youtube playlist opened');
    document.querySelectorAll('.yt-next-continuation').forEach(b => b.click());

    document.addEventListener('keypress', k => {
        if (k.key == 'r'){
            var videos = document.querySelectorAll('.ytd-two-column-browse-results-renderer .ytd-playlist-video-renderer a#thumbnail');
            console.log('Videos found: ', videos.length);

            var randomVideo = videos[Math.floor(Math.random() * videos.length)];
            console.log(randomVideo);

            randomVideo.click();
        }
    });
})();