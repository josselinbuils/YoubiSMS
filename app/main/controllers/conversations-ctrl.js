'use strict';

angular.module('main').controller('ConversationsCtrl', function ($cordovaStatusbar, $ionicListDelegate, $ionicLoading, $ionicPlatform, $log, $scope, $state, SmsManagerServ, WebRtcServ) {

  /* Scope variables */

  $scope.SmsManagerServ = SmsManagerServ;

  /* Scope functions */

  $scope.deleteConversation = function (id) {
    $ionicListDelegate.closeOptionButtons();
    SmsManagerServ.deleteConversation(id);
  };

  $scope.loadConversation = function (id) {
    $log.debug('ConversationsCtrl->loadConversation(' + id + ')');

    SmsManagerServ.getMessages(id).then(function (messages) {
      $state.go('conversation', {
        id: id,
        messages: messages
      });
    });
  };

  $scope.newMessage = function () {
    $log.debug('ConversationCtrl->newMessage()');
    $state.go('newMessage');
  };

  /* Events */

  $ionicPlatform.ready(function () {
    if (ionic.Platform.isAndroid()) {
      $cordovaStatusbar.styleHex('#0a3070');
    } else {
      $ionicLoading.show({
        template: '<ion-spinner icon="ripple" class="spinner-positive"></ion-spinner><div>Connexion au téléphone...</div>'
      });
    }

    SmsManagerServ.init();
    WebRtcServ.init();
  });

  $scope.$on('$ionicView.enter', function () {
    $ionicPlatform.registerBackButtonAction(function () {
      navigator.app.exitApp();
    }, 101);
  });

  $scope.$on('SmsManagerServ.conversationsUpdated', function () {
    $log.debug('ConversationsCtrl->SmsManagerServ.conversationsUpdated: apply changes.');

    if (!ionic.Platform.isAndroid()) {
      $ionicLoading.hide();
    }

    $scope.$applyAsync();
  });

  $scope.$on('SmsManagerServ.convThumbnailLoaded', function () {
    $log.debug('ConversationsCtrl->SmsManagerServ.convThumbnailLoaded: apply changes.');
    $scope.$applyAsync();
  });

  $scope.$on('SmsManagerServ.convThumbnailReceived', function () {
    $log.debug('ConversationsCtrl->SmsManagerServ.convThumbnailReceived: apply changes.');
    $scope.$applyAsync();
  });
});
