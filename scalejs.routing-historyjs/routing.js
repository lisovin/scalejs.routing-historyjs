/*global define,window,document*/
/*jslint todo:true*/
define([
    './history'
], function (
    history
) {
    'use strict';

    function routing(core) {
        var has = core.object.has,
            is = core.type.is,
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


        //TODO: testing on more complex queries.
        function deserialize(string) {
            var pairs = string.split("&"),
                data = {};
            pairs.forEach(function (pair) {
                pair = pair.split("=");
                data[pair[0]] = decodeURIComponent(pair[1]);
            });
            return data;
        }

        //TODO: testing on more complex queries.
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

            //suid appears when there is a hash. therefore we remove it.
            if (url.indexOf('&_suid') !== -1) {
                url = url.substr(0, url.indexOf('&_suid'));
            }

            evt = evt.hash.replace("/", "").replace("?", "");
            if (evt === "") {
                return { url: url };
            }

            evt = evt.split("?");
            if (evt[0].indexOf("&") !== -1) {
                return {
                    query: deserialize(evt[0]),
                    url: url
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
            return state('router', state('waiting', onEntry(function () {
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
                        curr = curr === '?/' ? '?' : curr; //remove '/' from url so it is blank if we navigate to root(/).
                        navigate(info.location === '/' ? '' : info.location, query);
                    }
                });

                observe().subscribe(function (e) {
                    if (isCurrent(e.url)) { return; } //do not cause statechange if url is the same!

                    var query = e.query || {},
                        location = e.location || '/'; //if there is no location, use root(/)

                    raise(location + '.routed', query, 0);
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
