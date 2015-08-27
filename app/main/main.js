'use strict';

angular.module('main', ['ionic', 'ngCordova', 'ui.router', 'LocalStorageModule']).config(function ($stateProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider, $logProvider) {

  $logProvider.debugEnabled(true);

  $ionicConfigProvider.backButton.previousTitleText('').text('');
  $ionicConfigProvider.navBar.alignTitle('left');

  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|content):|data:image\//);

  $urlRouterProvider.otherwise('/conversations');

  $stateProvider.state('conversations', {
    url: '*path',
    templateUrl: 'main/templates/conversations.html',
    controller: 'ConversationsCtrl'
  }).state('conversation', {
    templateUrl: 'main/templates/conversation.html',
    controller: 'ConversationCtrl',
    params: {
      id: null,
      messages: null
    }
  }).state('newMessage', {
    templateUrl: 'main/templates/newMessage.html',
    controller: 'NewMessageCtrl'
  });
});

angular.module('main').run(function ($rootScope) {

  window.addEventListener('native.keyboardhide', function (event) {
    $rootScope.$broadcast('native.keyboardhide', event);
  });

  window.addEventListener('native.keyboardshow', function (event) {
    $rootScope.$broadcast('native.keyboardshow', event);
  });
});
