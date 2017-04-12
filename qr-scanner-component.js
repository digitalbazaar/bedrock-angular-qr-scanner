/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
define(['angular', './jsqr-src/jsqr'], function(angular, jsQR) {

'use strict';

function register(module) {
  module.component('brQrScanner', {
    bindings: {
      // minimum x and y resolution
      resolution: '<brResolution',
      // display width
      width: '<brWidth',
      // display height
      height: '<brHeight',
      onSuccess: '&brOnSuccess',
      onError: '&brOnError',
      onVideoError: '&brOnVideoError'
    },
    controller: Ctrl
  });
}

/*
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
// simple polyfill to avoid larger webrtc adaptor.
(function polyfill() {
  // Older browsers might not implement mediaDevices at all, so we set an empty
  // object first
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  // Some browsers partially implement mediaDevices. We can't just assign an
  // object with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {

      // First get ahold of the legacy getUserMedia, if present
      var getUserMedia = navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with
      // an error to keep a consistent interface
      if (!getUserMedia) {
        return Promise.reject(
          new Error('getUserMedia is not implemented in this browser'));
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a
      // Promise
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }
})();
*/

/* @ngInject */
function Ctrl($element, $window, brMediaQueryService) {
  var self = this;
  self.devices = null;
  self.working = false;
  var animationFrame;
  var context;
  var video;
  var resolution;
  var width;
  var height;
  var videoStream;

  window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

  self.$onInit = function() {
    resolution = self.resolution || 480;
    width = self.width || 320;
    height = self.height || 240;

    video = $window.document.createElement('video');
    video.setAttribute('style', 'display:none;');
    var canvas = $window.document.createElement('canvas');
    canvas.setAttribute('id', 'qr-canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    var constraints = {
      video: {
        facingMode: 'environment',
        width: {
          min: 480,
          ideal: resolution
        },
        height: {
          min: 480,
          ideal: resolution
        }
      }
    };
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      videoStream = stream;
      /*
      // rotate view for front facing devices
      if(!self.backDevice || self.backDevice.length === 0) {
        canvas.setAttribute(
          'style', '-moz-transform:rotateY(-180deg);' +
          '-webkit-transform:rotateY(-180deg);' +
          'transform:rotateY(-180deg);');
      }
      */
      angular.element($element).append(video);
      angular.element($element).append(canvas);
      context = canvas.getContext('2d');

      console.log('Stream started...');
      self.video = video;
      // Older browsers may not have srcObject
      if ('srcObject' in video) {
        video.srcObject = stream;
      } else {
        // Avoid using this in new browsers, as it is going away.
        video.src =
          (window.URL && window.URL.createObjectURL(stream)) || stream;
      }
      video.onloadedmetadata = function(e) {
        video.play();
        requestAnimationFrame(tick);
      };
    }).catch(function(err) {
      console.error('Error using device:', err);
      self.onVideoError({error: err});
      //console.error(err.name + ": " + err.message);
    });

    /*
    if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
    } else {
      navigator.mediaDevices.enumerateDevices()
        .then(function(devices) {
          console.log('devices', devices);
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
          if(!device) {
            throw new Error('No video input device found.');
          }
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
            videoStream = stream;
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
            video.src =
              (window.URL && window.URL.createObjectURL(stream)) || stream;
            self.video = video;
            video.play();
            console.log('Stream started...');
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
    */
  };

  function tick() {
    animationFrame = $window.requestAnimationFrame(tick);
    if(video.readyState === video.HAVE_ENOUGH_DATA) {
      // video source
      var sx = 0;
      var sy = 0;
      var sWidth = video.videoWidth;
      var sHeight = video.videoHeight;
      var sAspect = sWidth/sHeight;
      // canvas destination
      var dx = 0;
      var dy = 0;
      var dWidth = width;
      var dHeight = height;
      var dAspect = dWidth/dHeight;

      // Crop source if needed to fit into destination with same aspect ratio.
      // This is used to account for differences in source and destination
      // dimenstions as well as source dimension changes when a device
      // orientation changes.
      if(sAspect !== dAspect) {
        if(sAspect > dAspect) {
          // clip left/right of source
          sWidth = video.videoHeight * dAspect;
          sx = (video.videoWidth - sWidth) / 2;
        } else {
          // clip top/bottom of source
          sHeight = video.videoWidth / dAspect;
          sy = (video.videoHeight - sHeight) / 2;
        }
      }

      context.drawImage(
        video,
        sx, sy, sWidth, sHeight,
        dx, dy, dWidth, dHeight);
      var imageData = context.getImageData(dx, dy, dWidth, dHeight);
      var data = jsQR.decodeQRFromImage(
        imageData.data, imageData.width, imageData.height);
      if(data) {
        self.onSuccess({data: data});
      }
    }
  }

  self.$onDestroy = function() {
    videoStream.getTracks().map(function(t) { t.stop() });
    if($window.cancelAnimationFrame) {
      $window.cancelAnimationFrame(animationFrame);
    }
  };
}

return register;

});
