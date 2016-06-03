angular.module('terrama2.analysis.registration', [
    'terrama2',
    'terrama2.services',
    'terrama2.components.messagebox',
    'schemaForm',
    'treeControl'
  ])

  .controller('AnalysisRegistration',
    [
      '$scope',
      'ServiceInstanceFactory',
      'DataSeriesFactory',
      'DataSeriesSemanticsFactory',
      'AnalysisFactory',
      'DataProviderFactory',
  function($scope, ServiceInstanceFactory, DataSeriesFactory, DataSeriesSemanticsFactory, AnalysisFactory, DataProviderFactory) {
    // initializing objects
    $scope.analysis = {
      metadata: {}
    };
    $scope.instances = [];
    $scope.dataSeriesList = [];
    $scope.dataProvidersList = [];
    $scope.dataProviders = [];

    // define dataseries selected in modal
    $scope.nodesDataSeries = [];

    // define dataseries selected to analysis
    $scope.selectedDataSeriesList = [];
    $scope.metadata = {};
    $scope.semantics = {};
    $scope.storagerFormats = [];
    $scope.buffers = {
      "static": [],
      "dynamic": []
    }

    // dataseries tree modal
    $scope.treeOptions = {
      nodeChildren: "children",
      multiSelection: true,
      dirSelectable: false,
      injectClasses: {
        ul: "list-group",
        li: "list-group-item",
        liSelected: "active",
        iExpanded: "without-border",
        iCollapsed: "without-border",
        iLeaf: "as",
        label: "a6",
        labelSelected: "2"
      }
    }

    $scope.dataSeriesGroups = [
      {name: "Static", children: []},
      {name: "Dynamic", children: []}
    ]

    // watchers
    // cleaning analysis metadata when analysis type has been changed.
    // fill storager formats
    $scope.$watch("analysis.type_id", function(value) {
      $scope.analysis.metadata = {};
      var semanticsType;
      switch(parseInt(value)) {
        case 1:
          semanticsType = "DCP";
          break;
        case 2:
          semanticsType = "GRID";
          break;
        case 3:
          semanticsType = "ANALYSIS_MONITORED_OBJECT";
          break;
        default:
          console.log("invalid analysis type");
          return;
          break;
      }

      $scope.storagerFormats = [];
      $scope.dataSeriesSemantics.forEach(function(dSemantics) {
        if(dSemantics.data_series_type_name === semanticsType) {
          $scope.storagerFormats.push(Object.assign({}, dSemantics));
        }
      });
    });

    // terrama2 alert box
    $scope.alertBox = {};
    $scope.display = false;
    $scope.alertLevel = null;
    $scope.close = function() {
      $scope.display = false;
    };

    $scope.formStorager = [];
    $scope.modelStorager = {};
    $scope.schemaStorager = {};

    $scope.$on('storagerFormatChange', function(event, args) {
      $scope.formatSelected = args.format;
      // todo: fix it. It is hard code

      DataSeriesSemanticsFactory.get(args.format.code, {metadata:true}).success(function(data) {
        var metadata = data.metadata;
        var properties = metadata.schema.properties;

        $scope.modelStorager = {};
        $scope.formStorager = metadata.form;
        $scope.schemaStorager = {
          type: 'object',
          properties: metadata.schema.properties,
          required: metadata.schema.required
        };

        $scope.dataProviders = [];

        $scope.dataProvidersList.forEach(function(dataProvider) {
          data.data_providers_semantics.forEach(function(demand) {
            if (dataProvider.data_provider_type.id == demand.data_provider_type_id)
              $scope.dataProviders.push(dataProvider);
          })
        });

        $scope.$broadcast('schemaFormRedraw');
      }).error(function(err) {
        console.log(err);
      });
    });

    DataSeriesSemanticsFactory.list().success(function(semanticsList) {
      $scope.dataSeriesSemantics = semanticsList;
    }).error(function(err) {
      console.log(err);
    });

    DataProviderFactory.get().success(function(dataProviders) {
      $scope.dataProvidersList = dataProviders;
    }).error(function(err) {
      console.log(err);
    });

    $scope.onStoragerFormatChange = function() {
      $scope.showStoragerForm = true;
      $scope.$broadcast('storagerFormatChange', {format: $scope.storager.format});

      // filtering data providers

    };

    // temp code for debugging
    var errorHelper = function(err) {
      console.log(err);
    };

    // getting instances
    ServiceInstanceFactory.get({type: 'ANALYSIS'}).success(function(services) {
      $scope.instances = services;
    }).error(errorHelper);

    // getting DataSeries
    DataSeriesFactory.get({schema: "all"}).success(function(dataSeriesObjects) {
      $scope.dataSeriesList = dataSeriesObjects;

      dataSeriesObjects.forEach(function(dSeries) {
        var semantics = dSeries.data_series_semantics;

        if (semantics.data_series_type_name == "STATIC_DATA") {
          dSeries.isDynamic = false;
          $scope.buffers["static"].push(dSeries);
        }
        else {
          dSeries.isDynamic = true;
          $scope.buffers["dynamic"].push(dSeries);
        }
      });

      $scope.dataSeriesGroups[0].children = $scope.buffers["static"];
      $scope.dataSeriesGroups[1].children = $scope.buffers["dynamic"];
    }).error(errorHelper);

    // helpers
    var formErrorDisplay = function(form) {
      angular.forEach(form.$error, function (field) {
        angular.forEach(field, function(errorField){
          errorField.$setDirty();
        })
      });
    };

    var makeDialog = function(level, bodyMessage, show, title) {
      $scope.alertBox.title = title || "Analysis Registration";
      $scope.alertBox.message = bodyMessage;
      $scope.alertLevel = level;
      $scope.display = show;
    }

    // handling functions
    // checking for empty data series table
    $scope.isEmptyDataSeries = function() {
      return $scope.selectedDataSeriesList.length === 0;
    }

    // it adds dataseries from modal to table
    $scope.addDataSeries = function() {
      var _helper = function(type, target) {
        $scope.buffers[type].some(function(element, index, arr) {
          if (element.id == target.id) {
            arr.splice(index, 1);
            return true;
          }
          return false;
        });
      }

      $scope.nodesDataSeries.forEach(function(target) {
        if (!target || !target.id)
          return;

        $scope.metadata[target.name] = {alias: target.name};
        $scope.selectedDataSeriesList.push(target);

        if (target.isDynamic) {
          _helper("dynamic", target);
        } else {
          _helper("static", target);
        }
      })

      $scope.nodesDataSeries = [];
    };

    $scope.removeDataSeries = function(dataSeries) {

      var _pushToBuffer = function(type, obj) {
        $scope.buffers[type].push(obj);
      };

      $scope.selectedDataSeriesList.some(function(dSeries, index, arr) {
        if (dSeries.id == dataSeries.id) {
          arr.splice(index, 1);
          var type = dSeries.isDynamic ? "dynamic" : "static";
          _pushToBuffer(type, dSeries);
          return true;
        }
      })
    }

    // it check if there is a dataseries selected
    $scope.isAnyDataSeriesSelected = function() {
      return $scope.selectedDataSeries && $scope.selectedDataSeries.id > 0;
    }

    // it handles hidden box with data-series analysis metadata
    $scope.onDataSeriesClick = function(dataSeries) {
      if ($scope.selectedDataSeries) {
        if (dataSeries.id == $scope.selectedDataSeries.id) {
          $scope.selectedDataSeries = {};
          return;
        }
      }

      $scope.metadata[dataSeries.name] = $scope.metadata[dataSeries.name] || {};
      $scope.selectedDataSeries = dataSeries;

      // getting data series semantics
      DataSeriesSemanticsFactory.get(dataSeries.data_series_semantics.code).success(function(data) {
        $scope.semantics = data;
      }).error(errorHelper);
    };

    // pcd metadata (radius format - km, m...)
    $scope.onMetadataFormatClick = function(format) {
      $scope.analysis.metadata.INFLUENCE_RADIUS_UNIT = format;
    };

    // save function
    $scope.save = function() {
      if ($scope.generalDataForm.$invalid) {
        formErrorDisplay($scope.generalDataForm);
        return;
      }

      if ($scope.storagerDataForm.$invalid || $scope.storagerForm.$invalid) {
        formErrorDisplay($scope.storagerDataForm);
        return;
      }

      if ($scope.scriptForm.$invalid) {
        formErrorDisplay($scope.scriptForm);
        return;
      }

      // checking for empty data series
      if ($scope.isEmptyDataSeries()) {
        makeDialog("alert-danger", "Select at least a Data Series", true);
        return;
      }

      // checking dataseries analysis
      var dataSeriesError = {};
      var hasError = $scope.selectedDataSeriesList.some(function(dSeries) {
        if (!$scope.metadata[dSeries.name]) {
          dataSeriesError = dSeries;
          return true;
        }
      })

      if (hasError) {
        makeDialog("alert-danger", "Invalid data series. Please fill out alias in " + dataSeriesError.name, true);
        return;
      }

      // cheking influence form: DCP and influence form valid
      if ($scope.analysis.type_id == 1) {
        var form = angular.element('form[name="influenceForm"]').scope()['influenceForm'];
        if (form.$invalid) {
          formErrorDisplay(form);
          return;
        }
      }

      var analysisDataSeriesArray = [];
      // todo: improve it
      // temp code for sending analysis dataseries
      $scope.selectedDataSeriesList.forEach(function(selectedDS) {
        var metadata = $scope.metadata[selectedDS.name] || {};
        var analysisDataSeries = {
          data_series_id: selectedDS.id,
          metadata: metadata,
          alias: metadata.alias,
          // todo: check it
          type_id: $scope.analysis.type_id
        };

        analysisDataSeriesArray.push(analysisDataSeries);
      });

      var analysisToSend = Object.assign({}, $scope.analysis);
      analysisToSend.dataSeries = $scope.selectedDataSeriesList;
      analysisToSend.analysisDataSeries = analysisDataSeriesArray;

      var storager = Object.assign({}, $scope.storager, $scope.modelStorager);

      // sending post operation
      AnalysisFactory.post({
        analysis: analysisToSend,
        storager: storager
      }).success(function(data) {
        window.location = "/configuration/analyses";
      }).error(function(err) {
        console.log(err);
        makeDialog("alert-danger", err.message, true);
      });
    };
  }]);
