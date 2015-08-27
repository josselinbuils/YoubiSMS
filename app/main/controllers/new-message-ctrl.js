'use strict';

angular.module('main').controller('NewMessageCtrl', function ($ionicHistory, $ionicPlatform, $log, $scope, $state, SmsManagerServ, SmsWriterServ) {

  /* Scope variables */

  $scope.numbersFound;
  $scope.SmsManagerServ = SmsManagerServ;
  $scope.SmsWriterServ = SmsWriterServ;

  /* Scope functions */

  $scope.addContact = function (number) {
    SmsManagerServ.sendContact = number.phoneNumber;
    $('.sendingList').append('<div>' + number.contactName + '</div>');
    $('#contactsInput').val('');
    $scope.findNumbers();
    setTimeout(function () {
      $('#convInput').focus();
    }, 100);
  };

  $scope.goBack = function () {
    $ionicHistory.goBack();
  };

  $scope.findNumbers = function () {
    $scope.numbersFound = [];

    if ((ionic.Platform.isAndroid() && $('#contactsInput').val().length > 0) || $('#contactsInput').val().length > 1) {
      $log.debug('NewMessageCtrl->findNumbers()');

      var query = $('#contactsInput').val().toLowerCase();

      if (SmsManagerServ.contactNumbers.length > 0) {
        SmsManagerServ.contactNumbers.forEach(function (number) {
          var found = number.local.search(query) !== -1;
          found = found || number.local.replace(/ /g, '').search(query) !== -1;
          found = found || number.contactName.toLowerCase().search(query) !== -1;

          if (found) {
            $scope.numbersFound.push(number);
          }
        });
      }
    }

    if ($scope.numbersFound.length > 0) {
      SmsManagerServ.getContactThumbnails($scope.numbersFound);

      if ($('#newMessageFooter').is(':visible')) {
        $('#newMessageFooter').hide();
        $('#newMessageContent').css('bottom', 0);
      }
    } else {
      $('#newMessageFooter').show();
      SmsWriterServ.resizeConvInput();
    }

    $scope.$applyAsync();
  };

  /* Events */

  $scope.$on('SmsManagerServ.contactThumbnailLoaded', function () {
    $log.debug('NewMessageCtrl->SmsManagerServ.contactThumbnailLoaded: apply changes.');
    $scope.$applyAsync();
  });

  $scope.$on('SmsManagerServ.contactThumbnailReceived', function () {
    $log.debug('NewMessageCtrl->SmsManagerServ.contactThumbnailReceived: apply changes.');
    $scope.$applyAsync();
  });

  /* Initialization */

  $('#contactsInput').on('keydown', function (e) {
    if (e.keyCode === 8 && $('#contactsInput').val().length === 0) {
      $('.contactsSelection > .sendingList > div:last').remove();
    }
  });

  $scope.$on('$ionicView.enter', function () {
    $log.debug('NewMessageCtrl: $ionicView.enter event received.');

    SmsWriterServ.setScope($scope);

    $ionicPlatform.registerBackButtonAction(function () {
      if ($('.emojiContainer').is(':visible')) {
        SmsWriterServ.slideUpEmoji();
      } else {
        $ionicHistory.goBack();
      }
    }, 101);

    $('#contactsInput').focus();

    SmsManagerServ.getContactNumbers().then(function () {
      $scope.findNumbers();
    });
  });

  $scope.$on('$ionicView.loaded', function () {
    $log.debug('NewMessageCtrl: $ionicView.loaded event received.');
    SmsWriterServ.resizeConvInput();
  });
});
