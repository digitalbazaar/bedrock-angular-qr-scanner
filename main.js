/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
define([
  'angular',
  './jsqr-src/jsqr',
  './qr-scanner-component'
], function(angular) {

'use strict';

var module = angular.module('bedrock.qr-scanner', []);

Array.prototype.slice.call(arguments, 2).forEach(function(register) {
  register(module);
});

});
