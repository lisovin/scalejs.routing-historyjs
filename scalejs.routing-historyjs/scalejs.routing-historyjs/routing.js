/*global define,window,document*/
/*jslint todo:true*/
define([
    'scalejs!core',
    './history',
    './router',
    'scalejs.statechart-scion',
    'scalejs.reactive'
], function (
    core,
    history,
    router
) {
    'use strict';

    var has = core.object.has,
        extend = core.object.extend,
        toArray = core.array.toArray,
        on = core.state.builder.on,
        gotoInternally = core.state.builder.gotoInternally,
        onEntry = core.state.builder.onEntry,
        state = core.state.builder.state,
        raise = core.state.raise,
        $yield = core.functional.builder.$yield,
        registerTransition = core.state.registerTransition,
        observeState = core.state.observe,
        // properties
        routerStateId,
        routerTransitions = [],
        disposable = new core.reactive.CompositeDisposable(),
        firstNavigation = true;

    function navigate(url) {
        if (firstNavigation) {
            firstNavigation = false;
            history.replace({ url: url });
        } else {
            history.add({ url: url });
        }
    }

    function setupRouting() {
        var currentUrl;

        disposable.add(observeState().subscribe(function (e) {
            var url;

            // do routing on state entry
            if (e.event !== 'entry') { return; }

            // try map data to url with the router
            url = router.tryToUrl(e.state, e.currentEvent.data);

            // if mapping succeded then navigate to url
            if (url) {
                navigate(url);
            }
        }));

        disposable.add(history.observe().subscribe(function (e) {
            var url = e.hash;

            if (currentUrl === url) { return; } //do not cause statechange if url is the same
            currentUrl = url;

            // needs a delay of 0 so that the transition is defined on the parent state
            raise('routed', { url: url }, 0);
        }));
    }

    function disposeRouting() {
        disposable.dispose();
        //routerTransitions = [];
    }

    function route(routeDef) {
        return $yield(function (s) {
            var transition;

            // add route for this state to router
            router.addRoute(s.id, routeDef);
            // create transition that would trigger on 'routed' event and will attempt to parse the url
            transition = on('routed', function (e) {
                // if path of the 'routed' event matches the route then transition is active
                var parsed = router.tryFromUrl(s.id, e.data.path);

                if (parsed) {
                    extend(e.data, parsed);
                    return true;
                }
            }, gotoInternally(s.id));

            // if router state is already added then register transition on that state
            // otherwise add transition to the list of transitions to be registered once 
            // the router state gets registered
            if (routerStateId) {
                registerTransition(routerStateId, transition);
            } else {
                routerTransitions.push(transition);
            }
        });
    }

    function routerState(stateId, optsOrBuilders) {
        var builders,
            builtRouterState;

        routerStateId = stateId;

        if (has(optsOrBuilders, 'baseUrl')) {
            router.setBaseUrl(optsOrBuilders.baseUrl);
            builders = toArray(arguments).slice(2, arguments.length);
        } else {
            builders = toArray(arguments).slice(1, arguments.length);
        }

        builtRouterState = state.apply(null, [
            routerStateId,
            on('router.disposing', gotoInternally('router.disposed')),
            state('router.waiting', onEntry(setupRouting)),
            state('router.disposed', onEntry(disposeRouting))
        ].concat(routerTransitions)
            .concat(builders));

        return builtRouterState;
    }

    return {
        route: route,
        routerState: routerState
    };
});
