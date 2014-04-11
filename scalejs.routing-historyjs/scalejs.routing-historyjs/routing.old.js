/*global define,window,document*/
/*jslint todo:true*/
define([
    'scalejs!core',
    './history',
    './routeMapper',
    'scalejs.statechart-scion',
    'scalejs.reactive'
], function (
    core,
    history,
    routeMapper
) {
    'use strict';

    var has = core.object.has,
        is = core.type.is,
        merge = core.object.merge,
        toArray = core.array.toArray,
        on = core.state.builder.on,
        gotoInternally = core.state.builder.gotoInternally,
        onEntry = core.state.builder.onEntry,
        state = core.state.builder.state,
        raise = core.state.raise,
        $yield = core.functional.builder.$yield,
        registerTransition = core.state.registerTransition,
        observeState = core.state.observe,
        routedStates = {},
        routerTransitions = [],
        first = true,
        baseUrl,
        routerStateId;

    function isBlank(url) {
        return url === '/' || url === '?' || url === '';
    }

    function serialize(data) {
        var url = "?" + data.path.join("/");

        if (has(data.parameters)) {
            url += "?" + Object.keys(data.parameters).map(function (k) {
                return k + "=" + data.parameters[k];
            }).join("&");
        }

        return url;
    }

    function deserialize(u) {
        var url = u.replace(/^\/*/, '') // remove leading /, e.g. /my/module -> my/module
                   .replace("/?", ""),
            data = isBlank(url) ? [['']] : url.split("?")
                .filter(function (p) { return p !== ""; })
                .map(function (d, i) {
                    if (i === 0) {
                        return d.split("/");
                    }
                    return d.split("&");
                });

        return {
            path: data[0],
            parameters: has(data[1]) ? data[1].reduce(function (acc, x) {
                var pair = x.split("=");
                acc[pair[0]] = pair[1];
                return acc;
            }, {}) : undefined
        };
    }

    function observeHistory() {
        return history
            .observe()
            .select(function (evt) {
                var url = evt.hash.replace(baseUrl, ""),
                    data = deserialize(url);

                return merge(data, {
                    url: serialize(data),
                    timestamp: new Date().getTime()
                });
            });
    }

    function removeBrackets(x) {
        return is(x, 'string') ? x.replace("{", "").replace("}", "") : x;
    }

    function route(r) {
        var data = deserialize(r);


        return $yield(function (s) {
            var transition;
            routedStates[s.id] = data;

            transition = on('routed', function (e) {
                if (e.data.path[0] === data.path[0]) {
                    data.path.slice(1).forEach(function (p, i) {
                        e.data[removeBrackets(p)] = e.data.path[i + 1];
                    });
                    e.data = merge(e.data, e.data.parameters);
                    return true;
                }
                return false;
            }, gotoInternally(s.id));

            if (routerStateId) {
                registerTransition(routerStateId, transition);
            } else {
                routerTransitions.push(transition);
            }
        });
    }

    function navigate(data) {
        if (first) {
            first = false;
            history.replace({ url: serialize(data) });
        } else {
            history.add({ url: serialize(data) });
        }
    }

    function routerState(sid, optsOrBuilders) {
        var disposable = new core.reactive.CompositeDisposable(),
            router,
            builders;

        routerStateId = sid;

        if (has(optsOrBuilders, 'baseUrl')) {
            baseUrl = optsOrBuilders.baseUrl;
            builders = toArray(arguments).slice(2, arguments.length);
        } else {
            builders = toArray(arguments).slice(1, arguments.length);
        }

        function subscribeRouter() {
            var curr;

            function isCurrent(url) {
                return url === curr;
            }

            disposable.add(observeState().subscribe(function (e) {
                var data;

                if (has(routedStates, e.state) && e.event === 'entry') {
                    data = routedStates[e.state];

                    data.path = data.path.map(function (p) {
                        /*jslint regexp: true*/
                        var pkey = p.match(/[^{}]+(?=\})/);
                        /*jslint regexp: false*/
                        if (has(pkey)) {
                            return e.currentEvent.data[pkey[0]];
                        }
                        return p;
                    });

                    if (has(data.parameters)) {
                        Object.keys(data.parameters).forEach(function (p) {
                            data.parameters[p] = e.currentEvent.data[removeBrackets(data.parameters[p])];
                        });
                    }

                    navigate(data);
                }
            }));

            disposable.add(observeHistory().subscribe(function (e) {
                if (isCurrent(e.url)) { return; } //do not cause statechange if url is the same!
                curr = e.url;

                // needs a delay of 0 so that the transition is defined on the parent state
                raise('routed', { path: e.path, parameters: e.parameters }, 0);
            }));
        }

        router = state.apply(null, [
            sid,
            on('router.disposing', gotoInternally('router.disposed')),
            state('router.waiting', onEntry(subscribeRouter)),
            state('router.disposed', onEntry(function () {
                disposable.dispose();
                routedStates = {};
                routerTransitions = [];
            }))
        ].concat(routerTransitions)
            .concat(builders));

        return router;
    }

    return {
        //back: back,
        route: route,
        routerState: routerState,
        routeMapper: routeMapper
    };
});
