// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.facebook.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Remove news
    document.querySelector('#pagelet_trending_tags_and_topics').remove();
    document.querySelector('#stories_pagelet_rhc').remove();
    document.querySelector('#pagelet_ego_pane').remove();

    document.querySelector('#pagelet_sidebar').remove();


})();