/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
import angular from 'angular';
import QrScannerComponent from './qr-scanner-component.js';

var module = angular.module('bedrock.qr-scanner', []);

module.component('brQrScanner', QrScannerComponent);
