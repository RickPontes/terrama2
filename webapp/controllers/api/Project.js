"use strict";

var DataManager = require("../../core/DataManager.js");
var Utils = require("../../core/Utils");
var ProjectError = require("../../core/Exceptions").ProjectError;
var TokenCode = require('./../../core/Enums').TokenCode;
var Promise = require('bluebird');
var TcpService = require('./../../core/facade/tcp-manager/TcpService');
var fs = require('fs');
var path = require("path");


module.exports = function(app) {
  return {
    post: function(request, response) {
      var projectObject = request.body;

      DataManager.addProject(projectObject).then(function(project) {
        // Creating default PostGIS and File providers
        var configFile = JSON.parse(fs.readFileSync(path.join(__dirname, "../../config/config.terrama2"), "utf-8"));

        // File data provider object
        var DefaultFileProvider = {
          name: "Local Folder",
          uri: "file://" + configFile.default.defaultFilePath,
          description: "Local Folder data server",
          data_provider_intent_id: 1,
          data_provider_type_id: 1,
          project_id: project.id,
          active: true
        };

        // PostGIS data provider object
        var uriPostgis = "postgis://" + configFile.default.db.username + ":" + configFile.default.db.password + "@" + configFile.default.db.host + ":5432/" + configFile.default.db.database;
        var DefaultPostgisProvider = {
          name: "Local Database PostGIS",
          uri: uriPostgis,
          description: "Local Database PostGIS data server",
          data_provider_intent_id: 1,
          data_provider_type_id: 4,
          project_id: project.id,
          active: true
        };
        var promises = [];
        promises.push(DataManager.addDataProvider(DefaultFileProvider));
        promises.push(DataManager.addDataProvider(DefaultPostgisProvider));

        return Promise.all(promises).then(function(providers){
          //sending providers to service
          providers.forEach(function(provider){
            TcpService.send({
              "DataProviders": [provider.toService()]
            });
          });
          var token = Utils.generateToken(app, TokenCode.SAVE, project.name);
          response.json({status: 200, result: project, token: token});
        });
      }).catch(function(err) {
        Utils.handleRequestError(response, err, 400);
      });
    },

    get: function(request, response) {
      var id = request.params.id;

      if (id) {
        DataManager.getProject({id: id}).then(function(project) {
          response.json(project);
        }).catch(function(err) {
          Utils.handleRequestError(response, err, 400);
        });
      } else {
        response.json(DataManager.listProjects());
      }
    },

    put: function(request, response) {
      var id = request.params.id;

      if (id) {
        var projectGiven = request.body;
        projectGiven.id = id;
        DataManager.updateProject(projectGiven).then(function(project) {
          var token = Utils.generateToken(app, TokenCode.UPDATE, project.name);
          response.json({status: 200, result: project, token: token});
        }).catch(function(err) {
          response.status(400);
          response.json({status: 400, message: err.message});
        });
      } else {
        Utils.handleRequestError(response, new ProjectError("Project name not identified"), 400);
      }
    },

    delete: function(request, response) {
      var id = request.params.id;
      if (id) {
        DataManager.getProject({id: id}).then(function(project) {
          DataManager.removeProject({id: id}).then(function() {
            // un-setting cache project
            app.locals.activeProject = {};
            var token = Utils.generateToken(app, TokenCode.DELETE, project.name);
            response.json({status: 200, name: project.name, token: token});
          }).catch(function(err) {
            Utils.handleRequestError(response, err, 400);
          });
        }).catch(function(err) {
          Utils.handleRequestError(response, new ProjectError("Project not found"), 400);
        });
      } else {
        Utils.handleRequestError(response, new ProjectError("Project id not typed"), 400);
      }
    }
  };
};
