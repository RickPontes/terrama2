angular.module("terrama2.services", [])
  .factory("DataProviderFactory", ["$http", function($http) {
    return {
      get: function() {
        return $http.get("/api/DataProvider", {});
      }
    }
  }])

  .factory("DataSeriesSemanticsFactory", ["$http", function($http) {
    var url = "/api/DataSeriesSemantics/";
    return {
      get: function(semanticsName, extra) {
        var data = extra instanceof Object ? extra : {};
        return $http({
          method: 'GET',
          url: url + semanticsName,
          params: data
        });
      },

      list: function(extra) {
        return $http({
          method: 'GET',
          url: url,
          params: extra instanceof Object ? extra : {}
        });
      }
    }
  }])

  .factory("DataSeriesFactory", ["$http", function($http) {
    var url = "/api/DataSeries";
    return {
      get: function(extra) {
        return $http({
          method: 'GET',
          url: url,
          params: extra instanceof Object ? extra : {}
        });
      },

      post: function(dataSeriesObject) {
        return $http.post(url, dataSeriesObject);
      }
    }
  }])

  .factory("ServiceInstanceFactory", ["$http", function($http) {
    var url = "/api/Service";
    return {
      get: function(extra) {
        return $http({
          method: 'GET',
          url: url,
          params: extra instanceof Object ? extra : {}
        })
      },

      post: function(serviceObject) {
        return $http.post(url, serviceObject);
      }
    }
  }])

  .factory("AnalysisFactory", ["$http", function($http) {
    var url = "/api/Analysis";
    return {
      get: function(extra) {
        return $http({
          method: 'GET',
          url: url,
          params: extra instanceof Object ? extra : {}
        })
      },

      post: function(serviceObject) {
        return $http.post(url, serviceObject);
      }
    }
  }]).

  factory("Socket", function($rootScope) {
    var socket = io.connect(window.location.origin);

    return {
      on: function(name, callback) {
        socket.on(name, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          })
        })
      },

      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    }
  });
