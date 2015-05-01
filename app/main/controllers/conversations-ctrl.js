'use strict';

angular.module('main').controller('ConversationsCtrl', function ($scope, SmsManager, $cordovaStatusbar, $ionicPlatform, $state, $ionicListDelegate) {
  $ionicPlatform.ready(function () {
    $cordovaStatusbar.styleHex('#0a3070');
    $scope.SmsManager = SmsManager;
    SmsManager.init($scope);
  });

  $scope.loadConversation = function (id) {
    $state.go('conversation', {
      id: id
    });
    $ionicListDelegate.closeOptionButtons();
  };
});
