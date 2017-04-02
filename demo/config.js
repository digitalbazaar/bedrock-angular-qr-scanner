/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
const config = require('bedrock').config;
const path = require('path');

// cache
config.paths.cache = path.resolve(path.join(__dirname, '../.cache'));

// server
config.server.port = 8002;
config.server.httpPort = 8001;
config.server.domain = 'localhost';

// branding
config.brand.name = 'QR Scanner Example';

config.views.vars.baseUri = config.server.baseUri;
config.views.vars.serviceHost = config.server.host;
config.views.vars.serviceDomain = config.server.domain;
config.views.vars.supportDomain = 'example.com';
config.views.vars.title = config.brand.name;
config.views.vars.siteTitle = config.brand.name;

// pseudo bower package for composer
const composerPath = path.resolve(path.join(__dirname, '..'));
config.requirejs.bower.packages.push({
  path: composerPath,
  manifest: path.join(composerPath, 'bower.json')
});

// pseudo bower package for demo files
const dir = path.join(__dirname);
config.requirejs.bower.packages.push({
  path: path.join(dir, 'components'),
  manifest: path.join(dir, 'bower.json')
});
