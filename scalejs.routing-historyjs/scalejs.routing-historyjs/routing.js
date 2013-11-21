/*global define,window,document*/
/*jslint todo:true*/
define([
    'scalejs!core',
    './history',
    'scalejs.statechart-scion',
    'scalejs.reactive'
], function (
    core,
    history
) {
    'use strict';
    var has = core.object.has,
        is = core.type.is,
        toArray = core.array.toArray,
        on = core.state.builder.on,
        gotoInternally = core.state.builder.gotoInternally,
        onEntry = core.state.builder.onEntry,
        state = core.state.builder.state,
        raise = core.state.raise,
        $yield = core.functional.builder.$yield,
        observeState = core.state.observe,
        routedStates = {},
        routerTransitions = [],
        first = true;

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

        if (url.indexOf('.') === 0) {
            url = url.substr(1, url.length - 1);
        }

        if (url.indexOf('?') !== 0 && url.indexOf('?') !== -1) {
            url = url.substr(url.indexOf('?'), url.length - 1);
        }

        evt = url.replace("?", "");
        if (evt === "") {
            return {
                url: url,
                timestamp: new Date().getTime()
            };
        }

        evt = evt.split("?");
        if (evt[0].indexOf("&") !== -1) {
            return {
                query: deserialize(evt[0]),
                url: url,
                timestamp: new Date().getTime()
            };
        }
        location = decodeURIComponent(evt[0]);
        if (has(evt[1])) {
            return {
                location: location,
                query: deserialize(evt[1]),
                url: url,
                timestamp: new Date().getTime()
            };
        }
        return {
            location: location,
            url: url,
            timestamp: new Date().getTime()
        };
    }

    //changes url
    function navigate(location, query) {
        if (first) {
            first = false;
            history.replace({ url: serialize(location, query) });
        } else {
            history.add({ url: serialize(location, query) });
        }
    }
    /*
    //goes back in history
    function back(steps) {
        window.history.go(has(steps) ? -steps : -1);
    }
    */

    //creates a route function for statechart
    function route(location, func) {
        /*ignore jslint start*/
        func = func || function () { return undefined; };
        /*ignore jslint end*/

        return $yield(function (s) {
            routedStates[s.id] = { location: location, query: func };
            //registerTransition('router',
            routerTransitions.push(
                on('routed', function (e) {
                    return e.data.location === location;
                }, gotoInternally(s.id))
            );
            //on(location + '.routed', gotoInternally(s.id)));
        });
    }

    function observeHistory() {
        return history
            .observe()
            .select(convertHistoryEventToNavigatonEvent);
    }

    function routerState(optsOrBuilders) {
        var disposable = new core.reactive.CompositeDisposable(),
            router,
            baseUrl,
            builders;

        if (has(optsOrBuilders, 'baseUrl')) {
            baseUrl = optsOrBuilders.baseUrl;
            builders = toArray(arguments).slice(1, arguments.length);
        } else {
            builders = toArray(arguments);
        }

        function subscribeRouter() {
            var curr;

            function isCurrent(url) {
                return url === curr;
            }

            disposable.add(observeState().subscribe(function (e) {
                var info,
                    query;

                if (has(routedStates, e.state) && e.event === 'entry') {
                    info = routedStates[e.state];
                    query = info.query.call(e.context);
                    curr = serialize(info.location, query);
                    curr = curr === '?/' ? '?' : curr; //remove '/' from url so it is blank if we navigate to root(/).
                    navigate(info.location === '/' ? '' : info.location, query);
                }
            }));

            disposable.add(observeHistory().subscribe(function (e) {
                if (isCurrent(e.url)) { return; } //do not cause statechange if url is the same!

                var query = e.query || {},
                    location = e.location || '/';

                if (has(baseUrl)) {
                    location = location.replace(new RegExp(baseUrl, "i"), '');
                }

                raise('routed', { location: location || '/', query: query }, 0);
            }));
        }

        router = state.apply(null, [
            'router',
            onEntry(subscribeRouter),
            on('router.disposing', gotoInternally('router.disposed')),
            state('router.waiting'),
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
        routerState: routerState
    };
});
