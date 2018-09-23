// ==UserScript==
// @name         Blizzard Forums
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://us.forums.blizzard.com/en/overwatch/c/*
// @grant        none
// ==/UserScript==

declare let angular;

(function() {
    'use strict';

    const commentsThreshold = 75;

    // Your code here...
    console.log('in Blizzard Forums script');
    
    // Format visited links differently
    $('head').append($("<style type='text/css'> a:visited { color: darkgray !important }</style>"));

    // This filters threads by # of comments

    setInterval(() => {
        filterLowCommentPosts();
    }, 5000);

    function filterLowCommentPosts() {
        $.makeArray(
            $('td.num.posts-map').map((i, e) => (
            {
                comments: parseInt($(e).text().replace('k', '').replace('.', '00')),
                threadElement: $(e).closest('tr')[0] })
            ))
            .filter(m => m.comments < commentsThreshold)
            .forEach(m => m.threadElement.remove());
    };
})();