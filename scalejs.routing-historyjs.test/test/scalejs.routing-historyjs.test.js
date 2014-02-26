/*global define,describe,expect,it*/
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
define([
    'scalejs!core',
    'history',
    'scalejs!application'
], function (core, History) {
    describe('routing', function () {
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

        function baseUrl() {
            return '/C:/git/scalejs.routing-historyjs/scalejs.routing-historyjs.test/index.test.html'
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