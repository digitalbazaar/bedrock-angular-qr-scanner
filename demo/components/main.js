/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
define([
  'angular',
  './demo-component'
], function(angular) {

'use strict';

var module = angular.module('qr-scanner-demo', [
  'bedrock.qr-scanner' // ,
  // 'monospaced.qrcode'
]);

Array.prototype.slice.call(arguments, 1).forEach(function(register) {
  register(module);
});

/* @ngInject */
module.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      title: 'Demo Home',
      template: '<demo-home></demo-home>'
    });
});

});
