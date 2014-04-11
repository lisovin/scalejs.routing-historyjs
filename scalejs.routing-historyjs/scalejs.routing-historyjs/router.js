/*global define,window,document,console*/
/*jslint todo:true*/
define([
    //'scalejs!core',
    './routeMapper'
], function (
    //core,
    routeMapper
) {
    'use strict';

    var routes = {},
        baseUrl;

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
        baseUrl = newBaseUrl;
    }

    return {
        addRoute: addRoute,
        tryToUrl: tryToUrl,
        tryFromUrl: tryFromUrl,
        setBaseUrl: setBaseUrl
    };
});
