/*global define,jasmine*/
define([
    'jasmine-html',
    'scalejs!application'
], function () {
    'use strict';

    require(['./test/scalejs.routing-historyjs.test'], function () {
        var jasmineEnv = jasmine.getEnv(),
            htmlReporter = new jasmine.HtmlReporter();

        jasmineEnv.updateInterval = 1000;
        jasmineEnv.addReporter(htmlReporter);

        jasmineEnv.specFilter = function (spec) {
            return htmlReporter.specFilter(spec);
        };

        jasmineEnv.execute();
    });

});
