/*global define*/
define([
    'scalejs!core',
    './scalejs.routing-historyjs/routing',
    'scalejs.reactive',
    'scalejs.statechart-scion'
], function (
    core,
    routing
) {
    'use strict';

    var extend = core.object.extend;

    function buildCore() {
        extend(core, { routing: routing(core) });
    }

    function buildSandbox(sandbox) {
        extend(sandbox, { routing: core.routing });
    }

    core.registerExtension({
        buildCore: buildCore,
        buildSandbox: buildSandbox
    });
});

