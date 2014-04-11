/*global define,window,document*/
/*jslint todo:true*/
define([
    'scalejs!core',
    './history',
    './routeMapper',
    './routerState',
    'scalejs.statechart-scion',
    'scalejs.reactive'
], function (
    core,
    history,
    routeMapper,
    createRouterState
) {
    'use strict';

    var raise = core.state.raise,
        observeState = core.state.observe,
        firstNavigation = true,
        routerState;

    function navigate(url) {
        if (firstNavigation) {
            firstNavigation = false;
            history.replace({ url: url });
        } else {
            history.add({ url: url });
        }
    }

    function initializeRouter() {
        var currentUrl;

        disposable.add(observeState().subscribe(function (e) {
            var routeMapper,
                url;

            // do routing on state entry
            if (e.event !== 'entry') { return; }

            // if state doesn't have a route associated with - nothing to do
            routeMapper = resolveRouteMapper(e.state);
            if (!routeMapper) { return; }

            url = routeMapper.toUrl(e.currentEvent.data);

            navigate(url);
        }));

        disposable.add(history.observe().subscribe(function (e) {
            var url = e.hash;

            if (currentUrl === url) { return; } //do not cause statechange if url is the same
            currentUrl = url;

            // needs a delay of 0 so that the transition is defined on the parent state
            raise('routed', { url: url }, 0);
        }));
    }

    function disposeRouter() {
        disposable.dispose();
        routedStates = {};
        routerTransitions = [];
    }

    routerState = createRouterState(initializeRouter, disposeRouter);

    return {
        //back: back,
        route: route,
        routerState: routerState,
        routeMapper: routeMapper
    };
});
