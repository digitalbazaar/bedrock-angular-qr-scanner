/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
import pako from 'pako';

export default {
  controller: Ctrl,
  templateUrl: 'bedrock-angular-qr-scanner-demo/demo-component.html'
};

/* @ngInject */
function Ctrl($scope) {
  var self = this;
  self.working = false;
  var dict = '@contextCredentialLinkedDataSignature2015signatureValuetype' +
    'issuehttps://w3id.org/https://checkpoint.veres.io/';
  self.vc = {
    "@context": [
      "https://w3id.org/identity/v1",
      "https://w3id.org/credentials/v1"
    ],
    "id": "https://checkpoint.veres.io/c/375b5fb5-1549-4fc0-9d37-193b9db7100d",
    "type": [
      "Credential"
    ],
    "claim": {
      "id": "did:5533d34a-b978-491a-b082-401ab777568a",
      "name": "Jane Doe"
    },
    "claimBasis": [{
      "type": "VerifiedPhysicalCredential",
      "credentialType": {
        "type": "GovernmentPhotoIdCard",
        "issuer": "https://us.gov#e5ef7c3e-41df-4cdc-a48f-927e809e07b2"
      }
    }],
    "issued": "2017-03-29T23:35:54.927Z",
    "issuer": "did:707e8216-8644-4fd0-b778-767cfdb47ef0",
    "signature": {
      "type": "LinkedDataSignature2015",
      "created": "2017-03-29T23:35:54Z",
      "creator": "https://checkpoint.veres.io/keys/1.3.1.1",
      "signatureValue": "ehdtHiVPCvNv81tA7cV+0CGbhZrGpZ+s8vshcrCvtCRRofRKyIbWV/jdISzDQc7QTTIXXK1Xov1eOBiopV0CK5LsU2iMUEIPumLlfCyVboPIHjtlA8G/13ApRRnlUBKUIt0/shgC55WDxUjx49BuyhVRnhLfSskeNGF13TTKxXAyvUWE9yfbDduhUgyCxh8yiKLPnfZgibmD2j8ro2XXqLFWaCYT+7QMVF9uVjrf+YYfC57UXAsrQgHDl/PNdwRs6KpSEvzgek/rAU3euIZItXDWwHgJu6zYEfAkr6r0eaonG8xZ0Bf2f+3QIsxRBCKVQIDLP2kZ1k5gwZ8SK3/74g=="
    }
  };

  self.vcText = JSON.stringify(self.vc, null, 2);

  $scope.$watch(function() {
    return self.vcText;
  }, function(newVal, oldVal) {
    if(newVal !== oldVal) {
      self.working = true;
      self.barcodeData = deflate(self.vcText);
      $scope.$evalAsync(function() {
        self.working = false;
      });
    }
  });

  function deflate(txt) {
    var rVal;
    try {
      var t = JSON.stringify(JSON.parse(txt));
      rVal = pako.deflate(t, {
        to: 'string',
        level: 9,
        dictionary: dict
      });
    } catch(e) {
      console.log('Error:', e);
    }
    return rVal;
  }

  self.barcodeData = deflate(self.vcText);

  self.setData = function(data) {
    console.log('QR Data:', data);
    self.data = data;
    try {
      self.decoded = JSON.parse(pako.inflate(
        data, {to: 'string', dictionary: dict}));
    } catch(e) {
      self.decoded = e;
    }
    $scope.$apply();
  };
}
