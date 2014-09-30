require.config({
    paths: {
        boot: '../lib/jasmine/boot',
        'jasmine-html': '../lib/jasmine/jasmine-html',
        jasmine: '../lib/jasmine/jasmine',
        'scalejs.routing-historyjs': '../build/scalejs.routing-historyjs'
    },
    shim: {
        jasmine: {
            exports: 'window.jasmineRequire'
        },
        'jasmine-html': {
            deps: [
                'jasmine'
            ],
            exports: 'window.jasmineRequire'
        },
        boot: {
            deps: [
                'jasmine',
                'jasmine-html'
            ],
            exports: 'window.jasmineRequire'
        }
    },
    scalejs: {
        extensions: [
            'scalejs.routing-historyjs'
        ]
    }
});

require(['boot'], function () {
    require ([
        './scalejs.routing-historyjs.test'
    ], function () {
        window.onload();
    });
});
