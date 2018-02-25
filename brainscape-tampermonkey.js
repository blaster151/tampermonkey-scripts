// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.brainscape.com/decks/6134596/review
// @grant        none
// ==/UserScript==
(function () {
    'use strict';
    // Your code here...
    $("img.img-thumbnail").each(function (i, e) { $(e).attr('src', $(e).attr('src').replace('image_thumb', 'image_original')); });
    $("table.card-review thead tr th:nth-child(2)").css("width", "70%");
})();
