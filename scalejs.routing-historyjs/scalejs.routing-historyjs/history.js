/*global define,window*/
define([
    'scalejs!core',
    'history',
    'scalejs.reactive'
], function (
    core,
    History
) {
    'use strict';

    function add(state) {
        History.pushState(state.data, state.title, state.url);
    }

    function get() {
        History.getState();
    }

    function replace(state) {
        History.replaceState(state.data, state.title, state.url);
    }

    function observe() {
        var observable = core.reactive.Observable,
            disposable = core.reactive.Disposable;

        return observable.createWithDisposable(function (observer) {
            var subscription = History.Adapter.bind(window, 'statechange', function () {
                observer.onNext(History.getState());
            });

            return disposable.create(function () {
                subscription.detach();
            });
        }).publishValue(History.getState())
            .refCount();
    }

    return {
        add: add,
        get: get,
        replace: replace,
        observe: observe
    };
});

