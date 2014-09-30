/*global define,window*/
define([
    'scalejs!core',
    'history',
    'rx'
], function (
    core,
    History,
    rx
) {
    'use strict';

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
        var observable = rx.Observable,
            disposable = rx.Disposable;

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

