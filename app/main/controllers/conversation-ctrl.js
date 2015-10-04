'use strict';

angular.module('main').controller('ConversationCtrl', function ($filter, $ionicHistory, $ionicPlatform, $ionicScrollDelegate, $log, $q, $scope, $state, $stateParams, $timeout, SmsManagerServ, SmsWriterServ) {

  /* Private variables */

  var contactInfosHeight;
  var windowWidth;

  /* Scope variables */

  $scope.SmsManagerServ = SmsManagerServ;
  $scope.SmsWriterServ = SmsWriterServ;
  $scope.conversation;
  $scope.messages;
  $scope.photo;

  /* Private function */

  // Return the size of an image if the image exists.
  // Also used to detect if an image exists.
  function getImageSize(src) {
    var deferred = $q.defer(),
      image = new window.Image();

    image.onerror = function () {
      deferred.resolve(null);
    };

    image.onload = function () {
      deferred.resolve({
        width: this.width,
        height: this.height
      });
    };

    image.src = src;

    return deferred.promise;
  }

  function getLocalPhoneNumber() {
    return $scope.conversation.contacts && window.isValidNumber($scope.conversation.contacts[0].phoneNumber, 'FR') ? window.formatLocal('FR', $scope.conversation.contacts[0].phoneNumber) : $scope.conversation.contacts[0].phoneNumber;
  }

  function initContactInfos() {
    $log.debug('ConversationCtrl->initContactInfos()');

    windowWidth = $(window).width();
    contactInfosHeight = Math.round(windowWidth / 16 * 9) - 1;

    $('.contactInfos').height(contactInfosHeight);
    $('.contactInfos > .address').css({
      'top': (contactInfosHeight - 30) + 'px'
    });

    SmsManagerServ.getContactPhoto($scope.conversation.contacts[0], function (photo) {
      setContactPhoto(photo);
    });
  }

  function setContactPhoto(photo) {
    $scope.photo = photo;

    getImageSize(photo).then(function (size) {
      var marginTop = -Math.round(((windowWidth / size.width * size.height) - contactInfosHeight) / 2);

      $('.contactInfos > img').css({
        'margin-top': marginTop + 'px'
      });
    });
  }

  function updateMessages() {
    $log.debug('ConversationCtrl->updateMessages()');

    SmsManagerServ.getMessages($scope.conversation.id).then(function (messages) {
      $scope.messages = messages;
      $timeout(function () {
        $ionicScrollDelegate.scrollBottom();
      });
    });
  }

  /* Scope functions */

  $scope.copyMessage = function (message) {
    $log.debug('ConversationCtrl->copyMessage()');

    if (ionic.Platform.isAndroid()) {
      cordova.plugins.clipboard.copy(message);
      window.plugins.toast.showShortBottom('Message copié');
    } else {
      window.prompt('Appuyez sur Ctrl+C (Windows) ou Cmd+C (Mac) pour copier le message.', message);
    }
  };

  $scope.copyPhoneNumber = function () {
    $log.debug('ConversationCtrl->copyPhoneNumber()');

    var number = getLocalPhoneNumber();

    if (ionic.Platform.isAndroid()) {
      cordova.plugins.clipboard.copy(number);
      window.plugins.toast.showShortBottom('Numéro copié');
    } else {
      window.prompt('Appuyez sur Ctrl+C (Windows) ou Cmd+C (Mac) pour copier le numéro.', number);
    }
  };

  $scope.getBody = function (message) {
    var body = '';

    if (message.type === 'mms') {
      message.content.forEach(function (part) {
        if (part.type === 'text/plain') {
          body += '<p>' + part.body + '</p>';

        } else if (part.type.substr(0, 5) === 'image') {
          body += '<img alt="" src="' + part.src + '" />';
        }
      });
    } else {
      body = message.body;
    }

    if (message.box === 'sent') {
      body += '<div class="messageStatus"><i class="icon ion-checkmark-round"></i> Envoyé</div>';

    } else if (message.box === 'outbox' && message.errorCode !== 0) {
      body += '<div class="messageStatus errorMessage"><i class="icon ion-alert-circled"></i> Non envoyé</div>';
    }

    return body;
  };

  $scope.getDate = function (msgId) {
    var message = $scope.messages[msgId];
    var date = message.dateSent > message.date ? message.dateSent : message.date;

    var lastMessage = msgId > 0 ? $scope.messages[msgId - 1] : message;
    var lastDate = lastMessage.dateSent > lastMessage.date ? lastMessage.dateSent : lastMessage.date;

    if ((date - lastDate) > (2 * 60 * 1000) || msgId === 0) {
      return $filter('date')(date, 'dd/MM/yyyy HH:mm');
    }

    return '';
  };

  $scope.getLocalPhoneNumber = getLocalPhoneNumber;

  $scope.hideContactInfos = function () {
    $log.debug('ConversationCtrl->hideContactInfos()');

    if ($('.contactInfos').is(':visible')) {
      $('.contactInfos').slideUp(100, 'linear');

      $('#contactInfosBackdrop').css({
        opacity: 0,
        visibility: 'hidden'
      });
    }
  };

  $scope.toggleContactInfos = function () {
    $log.debug('ConversationCtrl->toggleContactInfos()');

    if (!$('.contactInfos').is(':visible')) {
      $('.contactInfos').slideDown(100, 'linear');

      $('#contactInfosBackdrop').css({
        opacity: 1,
        visibility: 'visible'
      });
    } else {
      $scope.hideContactInfos();
    }
  };

  /* Events */

  $scope.$on('$ionicView.enter', function () {
    $log.debug('ConversationCtrl: $ionicView.enter event received.');

    SmsWriterServ.setScope($scope);

    $ionicPlatform.registerBackButtonAction(function () {
      if ($('.contactInfos').is(':visible')) {
        $scope.hideContactInfos();
      } else if ($('.emojiContainer').is(':visible')) {
        SmsWriterServ.slideUpEmoji();
      } else {
        $ionicHistory.goBack();
      }
    }, 101);
  });

  $scope.$on('$ionicView.loaded', function () {
    $log.debug('ConversationCtrl: $ionicView.loaded event received.');

    $scope.conversation = SmsManagerServ.getConversation($stateParams.id);
    $scope.messages = $stateParams.messages;
    SmsManagerServ.sendContact = $scope.conversation.contacts[0].phoneNumber;

    $timeout(function () {
      SmsWriterServ.resizeConvInput();
      initContactInfos();
    });
  });

  $scope.$on('native.keyboardhide', function () {
    $log.debug('ConversationCtrl: native.keyboardhide event received.');
    $ionicScrollDelegate.$getByHandle('convMessages').scrollBottom(true);
  });

  $scope.$on('native.keyboardshow', function () {
    $log.debug('ConversationCtrl: native.keyboardshow event received.');
    $ionicScrollDelegate.$getByHandle('convMessages').scrollBottom();
  });

  $scope.$on('SmsManagerServ.contactPhotoReceived', function (e, photo) {
    $log.debug('ConversationCtrl: SmsManagerServ.contactPhotoReceived event received.');
    setContactPhoto(photo);
  });

  $scope.$on('SmsManagerServ.dataUpdated', function () {
    $log.debug('ConversationCtrl: SmsManagerServ.dataUpdated event received.');
    updateMessages();
  });

  $scope.$on('SmsManagerServ.messageReceived', function () {
    $log.debug('ConversationCtrl: SmsManagerServ.messageReceived event received.');
    updateMessages();
  });
});
