/* global angular, _ */
'use strict';

angular.module('clustered.map', [])
  .factory('google', ['$window', function($window) {
    if ($window.google === undefined || $window.MarkerClusterer === undefined) {
      throw new Error('google is not bound to window');
    }
    return {
      maps: $window.google.maps,
      MarkerClusterer: $window.MarkerClusterer
    };
  }])
  .factory('utils', function() {
    return {
      getCenter: function(markers) {
        var barycenter = { x: 0, y: 0 }
        var sum = 0;
        markers.map(function(marker) {
          barycenter.x += marker[0] * marker[2]
          barycenter.y += marker[1] * marker[2]
          sum += marker[2]
        })

        barycenter.x /= sum
        barycenter.y /= sum

        return barycenter
      },
      getCalculator: function(markers, numStyles) {
        var weight = 0;

        for(var i = 0; i < markers.length; i++){
          weight += markers[i].weight;
        }

        return {
          text: weight,
          index: Math.min(String(weight).length, numStyles)
        };
      }
    };
  })
  .directive('clusteredMap', ['google', 'utils',
    function(google, utils) {
      return {
        restrict: 'EA',
        replace: true,
        template: '<div id="map_canvas"></div>',
        scope: {
          markers: '=',
          zoom: '=',
          center: '='
        },
        link: function(scope, element) {
          function initialize(markers) {
            var barycenter = scope.center || { x: 0, y:0 }

            if (!scope.center) {
              barycenter = utils.getCenter(markers)
            }

            var center = new google.maps.LatLng(Math.floor(barycenter.x), Math.floor(barycenter.y));
            var el = angular.element(element[0])[0]
            var map = new google.maps.Map(el, {
              zoom: scope.zoom || 2,
              center: center,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            });

            for (var i = 0; i < markers.length;++i) {
              markers[i] = new google.maps.Marker({
                position: new google.maps.LatLng(markers[i][0],markers[i][1]),
                weight:   markers[i][2],
                title:    'weight:' + markers[i][2]
              });
            }

            var markerCluster = new google.MarkerClusterer(map);
            markerCluster.setCalculator(utils.getCalculator);
            markerCluster.addMarkers(markers)
          }

          scope.$watch(
            function() { return scope.markers },
            function() {
              if (scope.markers)
                initialize(scope.markers)
            }
          )
        }
      }
    }])
