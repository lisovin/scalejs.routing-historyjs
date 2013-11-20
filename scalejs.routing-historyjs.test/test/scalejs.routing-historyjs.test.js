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
            routerState = core.routing.routerState,
            baseUrl = document.location.pathname.substring(1);

        it('is defined in the core', function () {
            expect(core.routing).toBeDefined();
        });

        it('when application starts root state gets entered', function () {
            var entered = jasmine.createSpy();

            registerStates('root', state('app', routerState(baseUrl)));
            registerStates('router', state('a', route('/'), entered));
            core.notifyApplicationStarted();

            core.notifyApplicationStopped();
            unregisterStates('app');

            expect(entered).toHaveBeenCalled();
        });

        it('when application starts again root state gets entered again', function () {
            var entered = jasmine.createSpy();

            registerStates('root', state('app', routerState(baseUrl)));
            registerStates('router', state('b', route('/'), entered));
            core.notifyApplicationStarted();

            core.notifyApplicationStopped();
            unregisterStates('app');

            expect(entered).toHaveBeenCalled();
        });

        it('when transition to another state url changes', function () {
            var entered = jasmine.createSpy();

            registerStates('root', state('app', routerState(baseUrl)));
            registerStates('router',
                state('a', route('/'), on('s', goto('b'))),
                state('b', route('b'), entered));
            core.notifyApplicationStarted();
            raise('s');

            console.log(document.location.href);

            core.notifyApplicationStopped();
            unregisterStates('app');

            expect(entered).toHaveBeenCalled();
        });
    });
});