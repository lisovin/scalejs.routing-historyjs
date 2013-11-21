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
        /*
        it('when application starts root state gets entered', function () {
            var entered = jasmine.createSpy();

            runs(function () {
                registerStates('root', state('t1', routerState(baseUrl())));
                registerStates('router', state('a', route('/'), onEntry(entered)));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                raise('router.disposing');

                core.notifyApplicationStopped();
                unregisterStates('t1');

                expect(entered).toHaveBeenCalled();
            });
        });
        */
        it('when application starts again root state gets entered again', function () {
            var entered = jasmine.createSpy();

            runs(function () {
                registerStates('root', state('t2', routerState(baseUrl())));
                registerStates('router', state('s1', route('/'), onEntry(entered)));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                raise('router.disposing');
                core.notifyApplicationStopped();
                unregisterStates('t2');

                expect(entered).toHaveBeenCalled();
            });
        });
        
        it('when transition to another state url changes', function () {
            var entered = jasmine.createSpy();

            runs(function () {
                registerStates('root', state('t3', routerState(document.location.pathname.substring(1))));
                registerStates('router',
                    state('x',
                        state('a', route('/'), on('s', goto('b'))),
                        state('b', route('b'), onEntry(entered))));
                core.notifyApplicationStarted();
            });

            waits(100);

            runs(function () {
                console.log('--->raising "s"');
                raise('s');
                console.log('--->done raising "s"');

                expect(entered).toHaveBeenCalled();
                expect(/\?b$/.test(document.location.href)).toBeTruthy();

                raise('router.disposing');
                core.notifyApplicationStopped();
                unregisterStates('t3');

            });
        });
    });
});