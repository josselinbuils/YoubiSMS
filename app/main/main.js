'use strict';
angular.module('main', [ 'ionic', 'ngCordova', 'ui.router', 'LocalStorageModule' ]).config(function ($stateProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider, $logProvider) {

  $logProvider.debugEnabled(true);

  $ionicConfigProvider.backButton.previousTitleText('').text('');
  $ionicConfigProvider.navBar.alignTitle('left');

  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|content):|data:image\//);

  $urlRouterProvider.otherwise('/');

  $stateProvider.state('conversations', {
    url: '/',
    templateUrl: 'main/templates/conversations.html',
    controller: 'ConversationsCtrl'
  }).state('conversation', {
    url: '/conversation/:id',
    templateUrl: 'main/templates/conversation.html',
    controller: 'ConversationCtrl'
  });
});
