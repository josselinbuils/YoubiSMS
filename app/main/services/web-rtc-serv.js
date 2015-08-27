'use strict';

angular.module('main').service('WebRtcServ', function ($ionicLoading, $ionicPopup, $log, $rootScope) {

  /* Private variables */

  var connection, peer;
  var key = '18tdu96ba10pb9';
  var isLoading = true;
  var self = this;

  /* Private functions */

  function connectToPhone() {
    $log.debug('WebRtcServ->connectToPhone()');

    $log.debug('WebRtcServ: get phone id from PeerDispatcher.');

    $.get('http://josselinbuils.synology.me:9000/?action=getPhoneId', function (res) {
      $log.debug('WebRtcServ: PeerDispatcher replied ' + res + '.');

      if (res.search('Error') === -1) {
        $log.debug('WebRtcServ: trying to connect to YoubiSMS Android app.');

        connection = peer.connect(res, {
          serialization: 'json'
        });

        connection.on('open', function () {
          $log.debug('WebRtcServ: connection to phone opened.');

          connection.on('data', function (data) {
            $log.debug('WebRtcServ: data received with key ' + data.key + '.');
            $rootScope.$broadcast('WebRtcServ.dataReceivedFromPhone', data);
          });

          connection.on('close', function () {
            $log.error('WebRtcServ: connection with the phone has been lost.');

            $ionicPopup.alert({
              title: 'Erreur',
              template: 'Oups, la connection avec le téléphone a été perdue. Essayez de relancer l\'application YoubiSMS sur ce dernier.'
            }).then(function () {
              window.close();
            });
          });

          isLoading = false;

          $rootScope.$broadcast('WebRtcServ.connectedToPhone');
        });
      }
    });
  }

  /* Public functions */

  self.init = function () {
    $log.debug('WebRtcServ->init()');

    peer = new window.Peer({
      key: key
    });

    $log.debug('WebRtcServ: trying to connect to WebRTC server.');

    peer.on('open', function (id) {
      $log.debug('WebRtcServ: connected to WebRTC server width id ' + id + '.');

      if (!ionic.Platform.isAndroid()) {
        connectToPhone();
      } else {
        $log.debug('WebRtcServ: send id to PeerDispatcher.');

        $.get('http://josselinbuils.synology.me:9000/?action=setPhoneId&id=' + id, function (res) {
          $log.debug('WebRtcServ: PeerDispatcher replied ' + res + '.');
        });

        peer.on('connection', function (conn) {
          $log.debug('WebRtcServ: new WebRTC connection.');

          $rootScope.$broadcast('WebRtcServ.newConnection');

          if (self.hasConnection()) { // /!\ Not traversed when the page is refreshed
            $log.debug('WebRtcServ: close active connection.');
            connection.close();
          }

          connection = conn;

          connection.on('open', function () {
            $log.debug('WebRtcServ: connection to client opened.');

            connection.on('data', function (data) {
              $log.debug('WebRtcServ: data received with key ' + data.key + '.');
              $rootScope.$broadcast('WebRtcServ.dataReceivedFromClient', data);
            });
          });
        });
      }

      peer.on('error', function (err) {
        $log.error('WebRtcServ: ' + err.type + '.');

        var error;

        switch (err.type) {

          case 'browser-incompatible':
            error = 'Oups, votre navigateur n\'est pas compatible avec certaines fonctionnalités WebRTC nécessaires à l\'application.';
            break;

          case 'network':
            if (ionic.Platform.isAndroid()) {
              error = 'Oups, la connexion réseau de votre téléphone a été réinitialisée. Veuillez relancer l\'application pour continuer à profiter du Cloud.';
            } else {
              error = 'Oups, un problème de connexion est survenu. Veuillez relancer l\'application';
            }
            break;

          case 'peer-unavailable':
            error = 'Oups, le téléphone est introuvable. Vérifiez que l\'application YoubiSMS est ouverte sur ce dernier.';
            break;

          case 'server-error':
            error = 'Oups, impossible de se connecter au serveur WebRTC.';
            break;

          default:
            error = 'Oups, le service WebRTC a renvoyé l\'erreur suivante : ' + err.type + '.';
        }

        if (!ionic.Platform.isAndroid() && isLoading) {
          $ionicLoading.hide();
        }

        $ionicPopup.alert({
          title: 'Erreur',
          template: error
        }).then(function () {
          if (!ionic.Platform.isAndroid()) {
            $log.debug('WebRtcServ: remove id on PeerDispatcher.');

            $.get('http://josselinbuils.synology.me:9000/?action=setPhoneId&id=' + id, function (res) {
              $log.debug('WebRtcServ: PeerDispatcher replied ' + res + '.');
            });

            window.close();
          }
        });
      });
    });
  };

  self.hasConnection = function () {
    return connection && connection.open;
  };

  self.send = function (data) {
    $log.debug('WebRtcServ->send(' + data.key + (data.data ? ', [data]' : '') + ')');

    if (self.hasConnection()) {
      connection.send(data);
    } else {
      $log.error('WebRtcServ: not connected.');

      $ionicPopup.alert({
        title: 'Erreur',
        template: 'Oups, la connection avec le serveur WebRTC a été perdue. Essayez de relancer l\'application.'
      }).then(function () {
        window.close();
      });
    }
  };
});
