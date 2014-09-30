/*global define*/
define([
    'scalejs!core',
    './scalejs.routing-historyjs/routing'
], function (
    core,
    routing
) {
    'use strict';

    core.registerExtension({ routing: routing });
});

