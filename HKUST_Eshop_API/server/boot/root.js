'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  var path = require('path');
  router.get('/', function(req, res) {
    res.sendFile(path.resolve('public/index.html'));
  });
  router.get('/apiList', function(req, res) {
    res.sendFile(path.resolve('public/apis.html'));
  });
  router.get('/status', server.loopback.status());
  server.use(router);
};
