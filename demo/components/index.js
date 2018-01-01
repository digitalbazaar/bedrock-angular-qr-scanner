/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from 'bedrock-angular';
import angular from 'angular';
import DemoComponent from './demo-component.js';

const module = angular.module('qr-scanner-demo', [
  'bedrock.form',
  'bedrock.qr-scanner',
  'monospaced.qrcode'
]);

bedrock.setRootModule(module);

module.component('brDemo', DemoComponent);

/* @ngInject */
module.config($routeProvider => {
  $routeProvider
    .when('/', {
      title: 'Demo Home',
      template: '<br-demo></br-demo>'
    });
});
