
/*global define,window*/
define('scalejs.routing-historyjs/history',[
    'scalejs!core',
    'history',
    'scalejs.reactive'
], function (
    core,
    History
) {
    

    function add(state) {
        return History.pushState(state.data, state.title, state.url);
    }

    function get() {
        return History.getState();
    }

    function replace(state) {
        return History.replaceState(state.data, state.title, state.url);
    }

    function observe() {
        var observable = core.reactive.Observable,
            disposable = core.reactive.Disposable;

        return observable.createWithDisposable(function (observer) {
            var subId = History.Adapter.bind(window, 'statechange', function () {
                observer.onNext(get());
            });

            return disposable.create(function () {
                History.Adapter.unbind(subId);
            });
        }).publishValue(get())
            .refCount();
    }

    return {
        add: add,
        get: get,
        replace: replace,
        observe: observe
    };
});


/*global define,window,document*/
/*jslint todo:true*/
define('scalejs.routing-historyjs/routing',[
    'scalejs!core',
    './history',
    'scalejs.statechart-scion',
    'scalejs.reactive'
], function (
    core,
    history
) {
    

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
        routedStates = {},
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
    /*
    //removes hash from url
    function removeHash() {
        history.replace({
            data: "",
            title: document.title,
            url: window.location.pathname + window.location.search
        });
    }*/

    //creates a route function for statechart
    function route(location, func) {
        /*ignore jslint start*/
        func = func || function () { return undefined; };
        /*ignore jslint end*/

        return $yield(function (s) {
            routedStates[s.id] = { location: location, query: func };
            registerTransition('router',
                on('routed', function (e) {
                    return e.data.location === location;
                }, gotoInternally(s.id)));
            //on(location + '.routed', gotoInternally(s.id)));
        });
    }

    //creates a routed state for statechart
    function routerState(baseUrl) {
        var disposable = new core.reactive.CompositeDisposable();

        function observeHistory() {
            return history
                .observe()
                .select(convertHistoryEventToNavigatonEvent);
        }

        return state('router',
            onEntry(function () {
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
            }),

            on('router.disposing', gotoInternally('router.disposed')),

            state('router.waiting'),
            state('router.disposed', onEntry(function () {
                disposable.dispose();
            })));
    }

    return {
        //observe: observe,
        //navigate: navigate,
        //removeHash: removeHash,
        //back: back,
        route: route,
        routerState: routerState
    };
});

/*global define*/
define('scalejs.routing-historyjs',[
    'scalejs!core',
    './scalejs.routing-historyjs/routing'
], function (
    core,
    routing
) {
    

    core.registerExtension({ routing: routing });
});

