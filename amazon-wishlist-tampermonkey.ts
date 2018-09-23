// ==UserScript==
// @name         Amazon Wishlist
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.amazon.com/gp/aw/ls
// @require https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js
// @require https://cdn.firebase.com/js/client/2.2.3/firebase.js
// @grant        none
// ==/UserScript==

// declare let $: any;

;
(function () {
    'use strict'
    console.log('very top of Amazon Wishlist');

    getAsJson();

    function getAsJson() {
        var initialMatches = document.querySelectorAll(".g-item-sortable");
        var booksAsJson = Array.prototype.map.call(initialMatches, function (el) {
            var title = el.querySelector('h3 a.a-link-normal').getAttribute('title');
            console.log(title);

            $(el).append($("<a href='https://www.goodreads.com/search?q=" + title + "'>Goodreads</a>"));
    
            return {}; });
        console.log(booksAsJson);

    }

    (<any>window).getAsJson = getAsJson;
})();
