
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
            History.Adapter.bind(window, 'statechange', function () {
                observer.onNext(get());
            });

            return disposable.create(function () {
                window.onstatechange = null;
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


/*global define*/
define('scalejs.routing-historyjs/routeMapper',[
    'scalejs!core'
], function (
    core
) {
    

    var clone = core.object.clone;

    /*
     * Given a mapping /a/{id}
     *   fromUrl('/a/1?x=2&y=t') will return { id: 1, x: 1, y: 't'}
     *   toUrl({id : 1, x: 1, y: 't'}) will return '/a/1?x=2&y=t'
     */
    return function routeMapper(mapping) {
        var cleanedMapping,
            routeGroups = [],
            mappingRegex;

        function createMappingRegex() {
            var routeGroupsMatches,
                mappingRegexText;

            cleanedMapping = mapping.replace(/^\/*|[/?]*$/g, ''); // strip leading '/' and ending '/' and '?'

            routeGroupsMatches = cleanedMapping.match(/{([^}])*}/g);
            if (routeGroupsMatches) {
                routeGroups = routeGroupsMatches.map(function (m) {
                    return m.replace(/[{}]/g, '');
                });
            }

            mappingRegexText = '^[/]*' + cleanedMapping.replace(/{[^}]*}/g, '(.+?)') + '[?/]*$';

            mappingRegex = new RegExp(mappingRegexText);
        }

        function fromUrl(url) {
            var urlElements,
                path,
                query,
                matches,
                result = {};

            urlElements = url.split(/\/*\?/);
            path = urlElements[0];
            query = url.substring(path.length).replace(/^[?/]*/, '');

            matches = path.match(mappingRegex);

            if (matches === null) {
                return null;
            }

            matches.shift(); // get rid of 0th group that matches whole string
            matches.forEach(function (m, i) {
                result[routeGroups[i]] = m;
            });

            query.split('&').map(function (kv) {
                var parts = kv.split('='),
                    key = parts[0],
                    value = parts[1];

                if (key) {
                    result[key] = value;
                }
            });

            return result;
        }

        function toUrl(data) {
            data = data ? clone(data) : {};

            var path,
                query = {};

            path = routeGroups.reduce(function (path, g) {
                var p = path.replace('{' + g + '}', data[g]);
                delete data[g];
                return p;
            }, cleanedMapping);

            query = Object.keys(data)
                .map(function (key) {
                    return key + '=' + data[key];
                })
                .join('&');

            return '/' + path + (query ? '?' + query : '');
        }

        createMappingRegex();

        return {
            fromUrl: fromUrl,
            toUrl: toUrl
        };
    };
});
/*ignore jslint end*/
;
/*global define,window,document,console*/
/*jslint todo:true*/
define('scalejs.routing-historyjs/router',[
    //'scalejs!core',
    './routeMapper'
], function (
    //core,
    routeMapper
) {
    

    var routes = {},
        baseUrl = '';

    function addRoute(routeName, route) {
        var mapper = routeMapper(route);
        routes[routeName] = mapper;
    }

    function tryFromUrl(routeName, url) {
        var mapper,
            parsed;

        if (url.indexOf(baseUrl) < 0) { return; }

        url = url.substring(baseUrl.length);

        mapper = routes[routeName];
        if (mapper) {
            parsed = mapper.fromUrl(url);
            return parsed;
        }
    }

    function tryToUrl(routeName, data) {
        var mapper,
            url;

        mapper = routes[routeName];
        if (mapper) {
            url = mapper.toUrl(data);
            return baseUrl + url;
        }
    }

    function setBaseUrl(newBaseUrl) {
        baseUrl = newBaseUrl || '';
        baseUrl = baseUrl.replace(/\/*$/, '');
    }

    return {
        addRoute: addRoute,
        tryToUrl: tryToUrl,
        tryFromUrl: tryFromUrl,
        setBaseUrl: setBaseUrl
    };
});

/*global define,window,document*/
/*jslint todo:true*/
define('scalejs.routing-historyjs/routing',[
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
            url = router.tryToUrl(e.state, e.currentEvent ? e.currentEvent.data : null);

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
                var parsed = router.tryFromUrl(s.id, e.data.url);

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

