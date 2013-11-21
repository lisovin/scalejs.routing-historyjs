/*global define,describe,expect,it*/
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
define([
    'scalejs!core',
    'scalejs!application'
], function (core) {
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
            var base = document.location.href.split('?')[1];

            return base ? decodeURIComponent(base) : document.location.pathname.substring(1);
        }

        it('is defined in the core', function () {
            expect(core.routing).toBeDefined();
        });

        it('when application starts root state gets entered', function () {
            var entered = jasmine.createSpy('t1.entered');

            runs(function () {
                registerStates('root',
                    routerState({ baseUrl: baseUrl() }, 
                        state('t1', route('/'), onEntry(entered))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                raise('router.disposing');

                core.notifyApplicationStopped();
                unregisterStates('router');

                expect(entered).toHaveBeenCalled();
            });
        });

        it('when application starts again root state gets entered again', function () {
            var entered = jasmine.createSpy('t2.onEntry');

            runs(function () {
                registerStates('root',
                    routerState({ baseUrl: baseUrl() },
                        state('t2', route('/'), onEntry(entered))));

                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                raise('router.disposing');
                core.notifyApplicationStopped();
                unregisterStates('router');

                expect(entered).toHaveBeenCalled();
            });
        });
        
        it('when transition to another state url changes', function () {
            var entered = jasmine.createSpy('b.onEntry');

            runs(function () {
                registerStates('root', 
                    routerState({ baseUrl: baseUrl() },
                        state('x',
                            state('a', route('/'), on('s', goto('b'))),
                            state('b', route('b'), onEntry(entered)))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                raise('s');

                expect(entered).toHaveBeenCalled();
                expect(/\?b$/.test(document.location.href)).toBeTruthy();

                raise('router.disposing');
                core.notifyApplicationStopped();
                unregisterStates('router');

            });
        });
    });
});