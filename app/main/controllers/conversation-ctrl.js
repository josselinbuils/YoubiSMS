'use strict';

angular.module('main').controller('ConversationCtrl', function ($scope, SmsManager, $stateParams, $filter) {

  /* Private variables */

  var MESSAGE_TYPE_INBOX = 1;

  /* Scope functions */

  $scope.getClass = function (message) {
    return 'message ' + (message.type === MESSAGE_TYPE_INBOX ? 'messageInbox' : 'messageSent');
  };

  $scope.getDate = function (message) {
    return $filter('date')(message.dateSent ? message.dateSent : message.date, 'dd/MM/yyyy HH:mm');
  };

  $scope.getConv = function () {
    return SmsManager.conversations[$stateParams.id];
  };
});
