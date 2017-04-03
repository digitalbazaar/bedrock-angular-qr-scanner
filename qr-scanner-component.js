/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
define(['angular', './jsqr-src/jsqr'], function(angular, jsQR) {

'use strict';

function register(module) {
  module.component('brQrScanner', {
    bindings: {
      width: '<brWidth',
      height: '<brHeight',
      onSuccess: '&brOnSuccess',
      onError: '&brOnError',
      onVideoError: '&brOnVideoError'
    },
    controller: Ctrl
  });
}

/* @ngInject */
function Ctrl($element, $window) {
  var self = this;
  self.devices = null;
  self.working = false;
  var animationFrame;
  var context;
  var video;
  var width;
  var height;

  window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
  navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mediaDevices.getUserMedia ||
  navigator.mozGetUserMedia || navigator.msGetUserMedia;

  self.$onInit = function() {
    height = self.height || 300;
    width = self.width || 250;

    video = $window.document.createElement('video');
    video.setAttribute('style', 'display:none;');
    var canvas = $window.document.createElement('canvas');
    canvas.setAttribute('id', 'qr-canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
    } else {
      navigator.mediaDevices.enumerateDevices()
        .then(function(devices) {
          self.devices = devices.filter(function(d) {
            return d.kind === 'videoinput';
          });
          // only one video device, use it
          if(self.devices.length === 1) {
            return self.devices[0];
          }
          self.backDevice = self.devices.filter(function(d) {
            return d.label.indexOf('facing back') !== -1;
          });
          if(self.backDevice.length === 1) {
            return self.backDevice[0];
          }
        }).then(function(device) {
          console.log('New Device:', device.label);
          return navigator.getUserMedia({
            video: {
              deviceId: {
                exact: device.deviceId
              },
              height: {
                min: 720
              }
            }
          }, function(stream) {
            // rotate view for front facing devices
            if(!self.backDevice || self.backDevice.length === 0) {
              canvas.setAttribute(
                'style', '-moz-transform:rotateY(-180deg);' +
                '-webkit-transform:rotateY(-180deg);' +
                'transform:rotateY(-180deg);');
            }
            angular.element($element).append(video);
            angular.element($element).append(canvas);
            context = canvas.getContext('2d');
            successCallback(stream);
          }, function(err) {
            console.error('Error using device:', err);
            self.onVideoError({error: err});
          });
        }).then(function() {
          requestAnimationFrame(tick);
        }).catch(function(err) {
          console.error(err.name + ": " + err.message);
        });
    }
  };

  function tick() {
    animationFrame = $window.requestAnimationFrame(tick);
    if(video.readyState === video.HAVE_ENOUGH_DATA) {
      context.drawImage(video, 0, 0, width, height);
      var imageData = context.getImageData(0, 0, width, height);
      var data = jsQR.decodeQRFromImage(
        imageData.data, imageData.width, imageData.height);
      if(data) {
        self.onSuccess({data: data});
      }
    }
  }

  var successCallback = function(stream) {
    console.log('Stream started...');
    video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    self.video = video;
    video.play();
  };

  self.$onDestroy = function() {
    if($window.cancelAnimationFrame) {
      $window.cancelAnimationFrame(animationFrame);
    }
    if($window.localMediaStream) {
      $window.localMediaStream.stop();
    }
  };
}

return register;

});
