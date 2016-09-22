'use strict';

/**
 * Facade Design Pattern - Analysis Registration
 *
 */
var Analysis = module.exports = { };

var DataManager = require("./../DataManager");
var PromiseClass = require("bluebird");
var AnalysisError = require("./../Exceptions").AnalysisError;
var Utils = require("./../Utils");
var TcpManager = require("../../core/TcpManager");

/**
 * @param {Object} analysisObject - An analysis object structure
 * @param {Object} storager - A storager object
 * @param {Object} scheduleObject - An schedule object structure
 * @param {number=} projectId - A current project id
 * @return {Promise<Analysis>} a bluebird promise with Analysis instance value
 *
 * @example
 */
Analysis.save = function(analysisObject, storager, scheduleObject, projectId) {
  return new PromiseClass(function(resolve, reject) {
    try {
      analysisObject.type = Utils.getAnalysisType(analysisObject.type_id);

      // if does not have project_id, getting from cache
      if (!analysisObject.project_id) { analysisObject.project_id = projectId; }

      // temp code. TODO:fix
      analysisObject.script_language_id = 1;
      analysisObject.data_series_id = analysisObject.dataSeries.id;

      var dataSeries = {
        name: analysisObject.name,
        description: "Generated by analysis " + analysisObject.name,
        data_provider_id: analysisObject.data_provider_id,
        data_series_semantic_id: storager.semantics.format.id,
        dataSets: [
          {
            active: true,
            format: storager.format
          }
        ]
      };

      DataManager.orm.transaction(function(t) {
        var options = {
          transaction: t
        };

        return DataManager.addDataSeries(dataSeries, {
            data_series_id: analysisObject.data_series_id,
            type: analysisObject.type
          }, options)
          
          .then(function(dataSeriesResult) {
            return DataManager.addSchedule(scheduleObject, options).then(function(scheduleResult) {
              // adding analysis
              analysisObject.dataset_output = dataSeriesResult.dataSets[0].id;
              analysisObject.schedule_id = scheduleResult.id;

              return DataManager.addAnalysis(analysisObject, options).then(function(analysisResult) {
                analysisResult.setSchedule(scheduleResult);
                analysisResult.setDataSeries(dataSeriesResult);

                // send tcp
                DataManager.listServiceInstances({}).then(function(services) {
                  services.forEach(function(service) {
                    try {
                      TcpManager.emit('sendData', service, {
                        "DataSeries": [analysisResult.dataSeries.toObject()],
                        "Analysis": [analysisResult.toObject()]
                      });
                    } catch (e) {
                      console.log(e);
                    }
                  });

                  console.log(JSON.stringify({
                    "DataSeries": [analysisResult.dataSeries.toObject()],
                    "Analysis": [analysisResult.toObject()]
                  }));
                }).catch(function(err) {
                  console.log(err);
                });

                return analysisResult;
              });
            });
        });
      })

      .then(function(analysis) {
        return resolve(analysis);        
      })

      .catch(function(err) {
        console.log(err);
        return reject(err);
      });
    } catch (err) {
      return reject(err);
    }
  });
};

/**
 * It represents a common facade for retrieving analysis list
 * 
 * @param {Object} restriction - A query restriction
 * @return {Promise<Array<Analysis>>} a bluebird promise with Analysis instances
 */
Analysis.list = function(restriction) {
  return new PromiseClass(function(resolve, reject) {
    DataManager.listAnalysis(restriction).then(function(analysisList) {
      var output = [];
      analysisList.forEach(function(analysis) {
        output.push(analysis.rawObject());
      });
      return resolve(output);
    }).catch(function(err) {
      return reject(err);
    });
  });
};

/**
 * It represents a common facade for updating analysis instance
 * 
 * @param {number} analysisId - An analysis identifier to update
 * @param {number} projectId - A current project identifier
 * @param {Analysis | Object} analysisObject - An analysis object values to update
 * @param {Schedule | Object} scheduleObject - A schedule object values to update
 * @return {Promise<Analysis>} A bluebird promise with analysis instance
 */
Analysis.update = function(analysisId, projectId, analysisObject, scheduleObject) {
  return new PromiseClass(function(resolve, reject) {
    DataManager.orm.transaction(function(t) {
      var options = {
        transaction: t
      };

      return DataManager.updateAnalysis(analysisId, analysisObject, scheduleObject, options)
        .then(function() {
          return DataManager.getAnalysis({id: analysisId, project_id: projectId}, options);
        })

        .then(function(analysisInstance) {
          Utils.sendDataToServices(DataManager, TcpManager, {
            "DataSeries": [analysisInstance.dataSeries.toObject()],
            "Analysis": [analysisInstance.toObject()]
          });
          return analysisInstance;        
        });
    })

    .then(function(analysis) {
      return resolve(analysis);
    })
    
    .catch(function(err) {
      return reject(err);
    });
  });
};

/**
 * It represents a common facade for analysis remove performs.
 * 
 * @param {number} analysisId - An analysis identifier
 * @param {number} projectId - A current project identifier
 * @return {Promise<Analysis>} A bluebird promise result
 */
Analysis.delete = function(analysisId, projectId) {
  return new PromiseClass(function(resolve, reject) {
    DataManager.getAnalysis({id: analysisId, project_id: projectId}).then(function(analysis) {
      DataManager.removeAnalysis({id: analysisId}, null).then(function() {
        var objectToSend = {
          "Analysis": [analysis.id],
          "DataSeries": [analysis.dataSeries.id]
        };

        DataManager.listServiceInstances().then(function(servicesInstance) {
          servicesInstance.forEach(function (service) {
            try {
              TcpManager.emit('removeData', service, objectToSend);

            } catch (e) {
              console.log(e);
            }
          });
        }).catch(function(err) {
          console.log(err);
        });

        return resolve(analysis);
      }).catch(function(err) {
        return reject(err);
      });
    }).catch(function(err) {
      return reject(err);
    });
  });
};