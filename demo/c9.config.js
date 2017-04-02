/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
const bedrock = require('bedrock');
const config = bedrock.config;

// only run application on HTTP port
bedrock.events.on('bedrock-express.ready', function(app) {
  // attach express to regular http
  require('bedrock-server').servers.http.on('request', app);
  // cancel default behavior of attaching to HTTPS
  return false;
});

// server info
config.server.port = 8081;
config.server.httpPort = process.env.C9_PORT;
config.server.bindAddr = [process.env.C9_IP];
config.server.domain = process.env.C9_HOSTNAME;
config.server.host = process.env.C9_HOSTNAME;
config.server.baseUri = 'https://' + config.server.host;
