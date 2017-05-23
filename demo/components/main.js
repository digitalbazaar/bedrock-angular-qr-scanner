/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
import angular from 'angular';
import DemoComponent from './demo-component.js';

var module = angular.module('qr-scanner-demo', [
  'bedrock.qr-scanner',
  'monospaced.qrcode'
]);

module.component('brDemo', DemoComponent);

/* @ngInject */
module.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      title: 'Demo Home',
      template: '<demo-home></demo-home>'
    });
});
