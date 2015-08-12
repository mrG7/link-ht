'use strict';

var _ = require('lodash');
var Logging = require('./logging.model');

var ES_HOST = process.env['ES_HOST'] || 'http://localhost';
var ES_HOST = 'http://localhost';
//------------------------------LOGGING---------------------------------
      var elasticsearch = require('elasticsearch');
      var client = new elasticsearch.Client({
        host: ES_HOST + ':9200',
        log: 'trace'
      });

exports.search = function(req) {
  client.create({
    index: 'query_logging',
    type: 'search',
    body: {
      username: "demo_user",
      query: req.body.elasticSearchText,
      published_at: Date.now(),
    }
  });           
}
//------------------------------LOGGING---------------------------------
