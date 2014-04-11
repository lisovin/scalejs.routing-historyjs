/*global define*/
define([
    'scalejs!core'
], function (
    core
) {
    'use strict';

    var clone = core.object.clone;

    /*
     * Given a mapping /a/{id}
     *   fromUrl('/a/1?x=2&y=t') will return { id: 1, x: 1, y: 't'}
     *   toUrl({id : 1, x: 1, y: 't'}) will return '/a/1?x=2&y=t'
     */
    return function routeMapper(mapping) {
        var cleanedMapping,
            routeGroups,
            mappingRegex;
        function createMappingRegex() {
            var mappingRegexText;
            cleanedMapping = mapping.replace(/^\/*|[/?]*$/g, ''); // strip leading '/' and ending '/' and '?'
            routeGroups = cleanedMapping
                .match(/{([^}])*}/g)
                .map(function (m) {
                    return m.replace(/[{}]/g, '');
                });

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
            data = clone(data);

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
