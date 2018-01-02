/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
import angular from 'angular';
// import jsQR from './jsqr-src/jsqr.js';
import ZXing from './zxing/zxing.js';

export default {
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
};

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
      const getUserMedia = navigator.webkitGetUserMedia ||
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
function Ctrl($element, $window) {
  const self = this;
  self.devices = null;
  self.working = false;
  let animationFrame;
  let context;
  let context2;
  let video;
  let resolution;
  let width;
  let height;
  let videoStream;
  let zxing;
  let zxingMemoryAllocated = false;
  let zxingMemoryPtr;
  let frameArray;

  window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

  self.$onInit = () => {
    zxing = new ZXing();
    resolution = self.resolution || 480;
    width = self.width || 320;
    height = self.height || 240;

    video = $window.document.createElement('video');
    video.setAttribute('style', 'display:none;');
    const canvas = $window.document.createElement('canvas');
    canvas.setAttribute('id', 'qr-canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    const canvas2 = $window.document.createElement('canvas');
    canvas2.setAttribute('id', 'qr-canvas2');
    canvas2.setAttribute('width', width);
    canvas2.setAttribute('height', height);

    const constraints = {
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
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
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
      angular.element($element).append(canvas2);
      context = canvas.getContext('2d');
      context2 = canvas2.getContext('2d');
      console.log('Stream started...');
      self.video = video;
      // Older browsers may not have srcObject
      if('srcObject' in video) {
        video.srcObject = stream;
      } else {
        // Avoid using this in new browsers, as it is going away.
        video.src =
          (window.URL && window.URL.createObjectURL(stream)) || stream;
      }
      video.onloadedmetadata = () => {
        video.play();
        requestAnimationFrame(tick);
      };
    }).catch(err => {
      console.error('Error using device:', err);
      self.onVideoError({error: err});
      // console.error(err.name + ": " + err.message);
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
      let sx = 0;
      let sy = 0;
      let sWidth = video.videoWidth;
      let sHeight = video.videoHeight;
      const sAspect = sWidth / sHeight;
      // canvas destination
      const dx = 0;
      const dy = 0;
      const dWidth = width;
      const dHeight = height;
      const dAspect = dWidth / dHeight;

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
      const imageData = context.getImageData(dx, dy, dWidth, dHeight);
      // const data = imageData.data;
      // for(let i = 0; i < data.length; i += 4) {
      //   const brightness =
      //     0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
      //   // red
      //   data[i] = brightness;
      //   // green
      //   data[i + 1] = brightness;
      //   // blue
      //   data[i + 2] = brightness;
      // }
      // overwrite original image
      // context2.putImageData(imageData, 0, 0, 0, 0, dWidth, dHeight);

      // TODO: arrange fallback to pure js
      // const data = jsQR.decodeQRFromImage(
      //   imageData.data, imageData.width, imageData.height);

      // TODO: can imageData.length be computed before the first capture?
      if(!zxingMemoryAllocated) {
        zxingMemoryPtr = zxing._malloc(dWidth * dHeight);
        // zxingMemoryPtr = zxing._malloc(imageData.data.length);
        // TODO: for later
        // zxingMemArray = new Uint8Array(wasmModule.wasmMemory.buffer, jsMemLoc, bytes);
        frameArray = new Uint8Array(dWidth * dHeight);
        zxingMemoryAllocated = true;
      }
      // TODO: write imageData directly to xing linear memory
      // write just the R component of the 4 byte pixel data to linear memory
      for(let i = 0; i < dWidth * dHeight; i++) {
        frameArray[i] = imageData.data[i * 4];
      }
      // copy the image to zxing's linear memory
      zxing.HEAPU8.set(frameArray, zxingMemoryPtr);
      // zxing.HEAPU8.set(imageData.data, zxingMemoryPtr);
      const ptr = zxing._decode_qr(
        zxingMemoryPtr, imageData.width, imageData.height);
      const detected_codes = new zxing.VectorZXingResult(ptr);
      for(let i = 0; i < detected_codes.size(); i++) {
        console.log(detected_codes.get(i).data);
        self.onSuccess({data: detected_codes.get(i).data});
      }
      detected_codes.delete();

      // if(data) {
      //   self.onSuccess({data: data});
      // }
    }
  }

  self.$onDestroy = () => {
    videoStream.getTracks().map(t => t.stop());
    if($window.cancelAnimationFrame) {
      $window.cancelAnimationFrame(animationFrame);
    }
  };
}
