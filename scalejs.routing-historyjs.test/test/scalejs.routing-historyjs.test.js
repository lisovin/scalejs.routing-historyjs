/*global define,describe,expect,it*/
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
define([
    'scalejs!core',
    'history',
    'scalejs.routing-historyjs/routeMapper',
    'scalejs.routing-historyjs/router',
    'scalejs!application'
], function (core, History, routeMapper, router) {
    var // imports
        registerStates = core.state.registerStates,
        unregisterStates = core.state.unregisterStates,
        raise = core.state.raise,
        state = core.state.builder.state,
        parallel = core.state.builder.parallel,
        onEntry = core.state.builder.onEntry,
        gotoInternally = core.state.builder.gotoInternally,
        on = core.state.builder.on,
        goto = core.state.builder.goto,
        has = core.object.has,
        route = core.routing.route,
        routerState = core.routing.routerState;

    describe('router mapping fromUrl', function () {
        it('/foo/bar', function () {
            var m = routeMapper('/foo/bar');

            expect(m.fromUrl('/foo/bar')).toEqual({ });
            expect(m.fromUrl('/foo/bar?abc=xyz&def=1.0')).toEqual({ abc: 'xyz', def: '1.0'});
        });

        it('/app/{id}', function () {
            var m = routeMapper('/app/{id}');

            expect(m.fromUrl('/app/1')).toEqual({ id: '1' });
            expect(m.fromUrl('/app/1/')).toEqual({ id: '1' });
            expect(m.fromUrl('app/1')).toEqual({ id: '1' });
            expect(m.fromUrl('app/1?')).toEqual({ id: '1' });
            expect(m.fromUrl('app/1/?')).toEqual({ id: '1' });
        });

        it('/app/{id}/', function () {
            var m = routeMapper('/app/{id}/');

            expect(m.fromUrl('/app/1')).toEqual({ id: '1' });
        });

        it('/app/{module}/{id}', function () {
            var m = routeMapper('/app/{module}/{id}');

            expect(m.fromUrl('/app/main/1')).toEqual({ module: 'main', id: '1' });
        });

        it('/app/{date}', function () {
            var m = routeMapper('/app/{date}');

            expect(m.fromUrl('/app/2014/1/10')).toEqual({ date: '2014/1/10' });
        });

        it('/app/{id} fromUrl /app/1?x=1&y=test&z=0.234&y=a/b/c', function () {
            var m = routeMapper('/app/{id}'),
                r = m.fromUrl('/app/1?x=1&y=test&z=0.234&q=a/b/c');

            console.log(r);

            expect(r).toEqual({ id: '1', x: '1', y: 'test', z: '0.234', q: 'a/b/c' });
        });

        it('/app/{id} fromUrl /app/1/?x=1&y=test&z=0.234&y=a/b/c', function () {
            var m = routeMapper('/app/{id}'),
                r = m.fromUrl('/app/1/?x=1&y=test&z=0.234&q=a/b/c');

            console.log(r);

            expect(r).toEqual({ id: '1', x: '1', y: 'test', z: '0.234', q: 'a/b/c' });
        });
    });

    describe('router mapping toUrl', function () {
        it('/foo/bar', function () {
            var m = routeMapper('/foo/bar');

            expect(m.toUrl({})).toEqual('/foo/bar');
            expect(m.toUrl({ abc: 'xyz', def: 1.0 })).toEqual('/foo/bar?abc=xyz&def=1');
        });

        it('/app/{id}', function () {
            var m = routeMapper('/app/{id}');

            expect(m.toUrl({ id: 1 })).toEqual('/app/1');
            expect(m.toUrl({ id: 1, x: 2, y: 'abc', z: 0.234 })).toEqual('/app/1?x=2&y=abc&z=0.234');
        });

        it('/app/{id}/', function () {
            var m = routeMapper('/app/{id}/');

            expect(m.toUrl({ id: 1 })).toEqual('/app/1');
            expect(m.toUrl({ id: 1, x: 2, y: 'abc', z: 0.234 })).toEqual('/app/1?x=2&y=abc&z=0.234');
        });

        it('/app/{module}/{id}', function () {
            var m = routeMapper('/app/{module}/{id}');

            expect(m.toUrl({ module: 'main', id: 1 })).toEqual('/app/main/1');
        });
    });

    describe('router', function () {
        beforeEach(function () {
            router.addRoute('myRoute', '/app/{id}');
        });

        it('tryToUrl returns `undefined` for unknown route', function () {
            var url = router.tryToUrl('noRoute', { id: 1 });
            expect(url).toBeUndefined();
        });

        it('tryFromUrl returns `undefined` for unknown route', function () {
            var data = router.tryFromUrl('noRoute', '/app/1');
            expect(data).toBeUndefined();
        });

        it('tryToUrl returns url for the known route', function () {
            var url = router.tryToUrl('myRoute', { id: '1', param: 'abc' });
            expect(url).toEqual('/app/1?param=abc');
        });

        it('tryFromUrl returns data for the known route', function () {
            router.addRoute('myRoute', '/app/{id}');
            var data = router.tryFromUrl('myRoute', '/app/1?param=abc');
            expect(data).toEqual({ id: '1', param: 'abc' });
        });

        it('tryToUrl returns url for the known route with baseUrl not ending with `/`', function () {
            router.setBaseUrl('/test');
            var url = router.tryToUrl('myRoute', { id: '1', param: 'abc' });
            expect(url).toEqual('/test/app/1?param=abc');
        });

        it('tryFromUrl returns data for the known route with baseUrl not ending with `/`', function () {
            router.setBaseUrl('/test');
            var data = router.tryFromUrl('myRoute', '/test/app/1?param=abc');
            expect(data).toEqual({id: '1', param: 'abc'});
        });

        it('tryToUrl returns url for the known route with baseUrl ending with `/`', function () {
            router.setBaseUrl('/test/');
            var url = router.tryToUrl('myRoute', { id: '1', param: 'abc' });
            expect(url).toEqual('/test/app/1?param=abc');
        });

        it('tryFromUrl returns data for the known route with baseUrl ending with `/`', function () {
            router.setBaseUrl('/test/');
            var data = router.tryFromUrl('myRoute', '/test/app/1?param=abc');
            expect(data).toEqual({ id: '1', param: 'abc' });
        });
    });

    describe('routing', function () {

        function baseUrl() {
            //return '/C:/git/scalejs.routing-historyjs/scalejs.routing-historyjs.test/index.test.html'
            // remove file:// since History.js stripes it away from url
            return document.location.href.substring(7); 
        }

        function disposeRouterAndStates() {
            raise('router.disposing');
            core.notifyApplicationStopped();
            unregisterStates('x');
        }


        it('is defined in the core', function () {
            expect(core.routing).toBeDefined();
        });

        it('when application starts root state gets entered', function () {
            var entered = jasmine.createSpy('t1.entered');

            runs(function () {
                History.replaceState(null, null, "?");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('t1', route('/'), onEntry(entered))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                expect(entered).toHaveBeenCalled();

                disposeRouterAndStates();
            });
        });
        
        it('when application starts again root state gets entered again', function () {
            var entered = jasmine.createSpy('t2.onEntry');

            runs(function () {
                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('t2', route('/'), onEntry(entered))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                expect(entered).toHaveBeenCalled();

                disposeRouterAndStates();
            });
        });
        
        it('when transition to state with route `b`, url becomes `?b`', function () {
            var entered = jasmine.createSpy('b.onEntry');

            runs(function () {
                registerStates('root', 
                    routerState('x', { baseUrl: baseUrl() },
                            state('a', route('/'), on('s', goto('b'))),
                            state('b', route('b'), onEntry(entered))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                raise('s');

                expect(entered).toHaveBeenCalled();
                expect(/\?b$/.test(document.location.href)).toBeTruthy();

                disposeRouterAndStates();
            });
        }); 

        it('when url `?b` is entered, transitions to appropriate state', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry');

            runs(function () {
                History.replaceState(null, null, "?b");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/')),
                        state('b', route('b'), onEntry(entered))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                expect(entered).toHaveBeenCalled();
                expect(/\?b$/.test(document.location.href)).toBeTruthy();

                disposeRouterAndStates();
            });
        });

        it('when transition to another state with route `b/{x}` and x=1, url becomes `?b/1`', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry');

            runs(function () {
                History.replaceState(null, null, "?");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b/{x}'), onEntry(entered))));
                core.notifyApplicationStarted();

            });

            waits(100);

            runs(function () {
                raise("s", { x: 1 });

                expect(entered).toHaveBeenCalled();
                expect(/\?b\/1$/.test(document.location.href)).toBeTruthy();

                disposeRouterAndStates();
            });
        });

        it('when url `?b/1` is entered, transitions to appropriate state and passes data', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry'),
                data;

            runs(function () {
                History.replaceState(null, null, "?b/1");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b/{x}'), onEntry(function (e) {
                            data = e.data;
                            entered();
                        }))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                expect(entered).toHaveBeenCalled();
                expect(data = { x: '1' }).toBeTruthy();

                disposeRouterAndStates();
            });
        });

        it('when transition to another state with route `b/{x}/{y}` and x = 1, y = 2, url becomes `?b/1/2`', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry');

            runs(function () {
                History.replaceState(null, null, "?");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b/{x}/{y}'), onEntry(entered))));
                core.notifyApplicationStarted();

            });

            waits(100);

            runs(function () {
                raise("s", { x: 1, y: 2 });

                expect(entered).toHaveBeenCalled();
                expect(/\?b\/1\/2$/.test(document.location.href)).toBeTruthy();

                disposeRouterAndStates();
            });
        });

        it('when url `?b/1/2` is entered, transitions to appropriate state and passes data', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry'),
                data;

            runs(function () {
                History.replaceState(null, null, "?b/1/2");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b/{x}/{y}'), onEntry(function (e) {
                            data = e.data;
                            entered();
                        }))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                expect(entered).toHaveBeenCalled();
                expect(data = { x: '1', y: '2' }).toBeTruthy();

                disposeRouterAndStates();
            });
        });

        it('when transition to another state with parameters `b?x={y}`, url changes', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry');

            runs(function () {
                History.replaceState(null, null, "?");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b?x={y}'), onEntry(entered))));
                core.notifyApplicationStarted();

            });

            waits(100);

            runs(function () {
                raise("s", { y: 1 });

                expect(entered).toHaveBeenCalled();
                expect(/\?b\?x=1$/.test(document.location.href)).toBeTruthy();

                disposeRouterAndStates();
            });
        });

        it('when url `?b?y=1` is entered, transitions to appropriate state and passes data', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry'),
                data;

            runs(function () {
                History.replaceState(null, null, "?b/1/2");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b?y={x}'), onEntry(function (e) {
                            data = e.data;
                            entered();
                        }))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                expect(entered).toHaveBeenCalled();
                expect(data = { x: '1'}).toBeTruthy();

                disposeRouterAndStates();
            });
        });

        it('when transition to state with route `b/{x}/{y}?z={z}&q={q}`, url is changed', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry'),
                data;

            runs(function () {
                History.replaceState(null, null, "?");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b/{x}/{y}?z={z}&q={q}'), onEntry(function (e) {
                            data = e.data;
                            entered();
                        }))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                raise("s", { x: 1, y: 2, z: 3, q: 4 });

                expect(entered).toHaveBeenCalled();
                expect(/\?b\/1\/2\?z\=3&q\=4$/.test(document.location.href)).toBeTruthy();

                disposeRouterAndStates();
            });
        });

        it('when complex url `b/1/2?z=3&q=4` with data is entered transitions, to appropriate state and passes data', function () {
            var entered = jasmine.createSpy('b.onEntry'),
                routerEntered = jasmine.createSpy('router.onEntry'),
                data;

            runs(function () {
                History.replaceState(null, null, "?b/1/2?z=3&q=4");

                registerStates('root',
                    routerState('x', { baseUrl: baseUrl() },
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b/{x}/{y}?z={z}&q={q}'), onEntry(function (e) {
                            data = e.data;
                            entered();
                        }))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {

                expect(entered).toHaveBeenCalled();
                expect(data = { x: 1, y: 2, z: 3, q: 4 }).toBeTruthy();

                disposeRouterAndStates();
            });
        });
    });
});