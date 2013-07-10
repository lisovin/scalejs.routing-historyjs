
/*global define,window*/
define('scalejs.routing-history/history',[
    'scalejs!core',
    'history'
], function (
    core,
    History
) {
    function add(state) {
        History.pushState(state.data, state.title, state.url);
    }

    function get() {
        History.getState();
    }

    function replace(state) {
        History.replaceState(state.data, state.title, state.url);
    }

    function observe() {
        var observable = core.reactive.Observable,
            disposable = core.reactive.Disposable;

        return observable.createWithDisposable(function (observer) {
            var subscription = History.Adapter.bind(window, 'statechange', function (e) {
                observer.onNext(History.getState());
            });

            return disposable.create(function () {
                subscription.detach();
            });
        }).publishValue(History.getState())
            .refCount();
    }

    return {
        add: add,
        get: get,
        replace: replace,
        observe: observe
    };
});


/*global define,window*/
/*jslint todo:true*/
define('scalejs.routing-history/routing',[
    './history'
], function (
    history
) {
    

    function routing(core) {
        var has = core.object.has,
            is = core.type.is,
            merge = core.object.merge,
            on = core.state.builder.on,
            gotoInternally = core.state.builder.gotoInternally,
            registerTransition = core.state.registerTransition,
            onEntry = core.state.builder.onEntry,
            state = core.state.builder.state,
            raise = core.state.raise,
            $yield = core.functional.builder.$yield,
            observeState = core.state.observe,
            navigated,
            routedStates = {};


        function deserialize(string) {
            var pairs = string.split("&"),
                data = {};
            pairs.forEach(function (pair) {
                pair = pair.split("=");
                data[pair[0]] = decodeURIComponent(pair[1]);
            });
            return data;
        }

        function serialize(location, query) {
            var url = "",
                params = [];

            function s(kv, base) {
                var keys = Object.keys(kv);
                if (!has(base)) {
                    base = "";
                }
                keys.forEach(function (key) {
                    if (is(kv[key], 'object')) {
                        s(kv[key], key);
                    } else if (is(kv[key], 'array')) {
                        params.push(base + encodeURIComponent(key) + "=" + encodeURIComponent(kv[key].join(",")));
                    } else {
                        params.push(base + encodeURIComponent(key) + "=" + encodeURIComponent(kv[key]));
                    }
                });
            }

            if (has(location)) {
                url = "?" + location;
            }
            if (has(query)) {
                url += "?";
                s(query);
                url += params.join("&");
            }
            return url;
        }

        function convertHistoryEventToNavigatonEvent(evt) {
            var location, url = evt.hash.replace("/", "");
            evt = evt.hash.replace("/", "").replace("?", "");
            if (evt === "") {
                return {};
            }
            evt = evt.split("?");
            if (evt[0].indexOf("&") !== -1) {
                return {
                    query: deserialize(evt[0])
                };
            }
            location = decodeURIComponent(evt[0]);
            if (has(evt[1])) {
                return {
                    location: location,
                    query: deserialize(evt[1]),
                    url: url
                };
            }
            return {
                location: location,
                url: url
            };
        }

        navigated = history
                .observe()
                .select(convertHistoryEventToNavigatonEvent)
                .publishValue(undefined)
                .refCount();

        //observable
        function observe() {
            return navigated.where(function (evt) {
                return has(evt);
            });
        }

        //changes url
        function navigate(location, query) {
            history.add({ url: serialize(location, query) });
        }

        //goes back in history
        function back(steps) {
            window.history.go(has(steps) ? -steps : -1);
        }

        //removes hash from url
        function removeHash() {
            history.replace({
                data: "",
                title: document.title,
                url: window.location.pathname + window.location.search
            });
        }

        //creates a route function for statechart
        function route(location, func) {
            func = func || function () { };

            return $yield(function (s) {
                routedStates[s.id] = { location: location, query: func };
                registerTransition('router',
                    on(location + '.routed', gotoInternally(s.id)));
            });
        }

        //creates a routed state for statechart
        function routerState() {
            return state('router',
                    state('waiting',
                        onEntry(function () {
                            var curr = "";

                            function isCurrent(url) {
                                return url === curr;
                            }

                            observeState().subscribe(function (e) {
                                var info,
                                    query;

                                if (has(routedStates, e.state) && e.event === 'entry') {
                                    info = routedStates[e.state];
                                    query = info.query.call(e.context);
                                    curr = serialize(info.location, query);
                                    navigate(info.location, query);
                                }
                            });

                            observe().subscribe(function (e) {
                                if (isCurrent(e.url)) { return; }

                                var query = e.query || {};
                                if (has(e.location)) {
                                    raise(e.location + '.routed', query, 0);
                                } else {
                                    raise('default.routed', query, 0);
                                }
                            });
                        })));
        }

        return {
            observe: observe,
            navigate: navigate,
            removeHash: removeHash,
            back: back,
            route: route,
            routerState: routerState
        };
    }

    return routing;
});

/*global define*/
define('scalejs.routing-history',[
    'scalejs!core',
    './scalejs.routing-history/routing',
    'scalejs.reactive',
    'scalejs.statechart-scion'
], function (
    core,
    routing
) {
    

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

