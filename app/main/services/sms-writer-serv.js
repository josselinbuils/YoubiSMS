'use strict';

angular.module('main').service('SmsWriterServ', function ($ionicHistory, $ionicScrollDelegate, $state, SmsManagerServ) {

  /* Private variables */

  var scope;
  var self = this;

  /* Public variables */

  self.emojis = ['&#x1F601;', '&#x1F602;', '&#x1F603;', '&#x1F604;', '&#x1F605;', '&#x1F606;', '&#x1F609;', '&#x1F60A;', '&#x1F60B;', '&#x1F60C;', '&#x1F60D;', '&#x1F60F;', '&#x1F612;',
    '&#x1F613;', '&#x1F614;', '&#x1F616;', '&#x1F618;', '&#x1F61A;', '&#x1F61C;', '&#x1F61D;', '&#x1F61E;', '&#x1F621;', '&#x1F622;', '&#x1F623;', '&#x1F624;', '&#x1F625;', '&#x1F628;',
    '&#x1F629;', '&#x1F62A;', '&#x1F62B;', '&#x1F62D;', '&#x1F630;', '&#x1F631;', '&#x1F632;', '&#x1F633;', '&#x1F635;', '&#x1F637;', '&#x1F638;', '&#x1F639;', '&#x1F63A;', '&#x1F63B;',
    '&#x1F63C;', '&#x1F63D;', '&#x1F63E;', '&#x1F63F;', '&#x1F640;', '&#x1F645;', '&#x1F646;', '&#x1F647;', '&#x1F648;', '&#x1F649;', '&#x1F64A;', '&#x1F64B;', '&#x1F64C;', '&#x1F64D;',
    '&#x1F64E;', '&#x1F64F;'
  ];

  /* Private function */

  function convInputChange() {
    scope.sendDisabled = $('#convInput').val().length === 0;
    resizeConvInput();
    scope.$applyAsync();
  }

  function resizeConvInput() {
    $('#convInput').css('height', 'auto');
    $('#convInput').height($('#convInput')[0].scrollHeight - 5);
    $('ion-content.has-footer').css('bottom', $('ion-footer-bar').height() + 'px');

    if ($state.is('conversation')) {
      $ionicScrollDelegate.$getByHandle('convMessages').scrollBottom();
    }
  }

  function showEmoji() {
    $('.emojiContainer').show();
    window.removeEventListener('native.keyboardhide', showEmoji);
    $('.has-footer').css('bottom', $('.convFooter').outerHeight() + 'px');
    $ionicScrollDelegate.scrollBottom();
  }

  function slideUpEmoji() {
    if ($('.emojiContainer').is(':visible')) {
      $('.emojiContainer').slideUp(100, function () {
        $('.has-footer').css('bottom', '44px');
        $ionicScrollDelegate.scrollBottom(true);
      });
    }
  }

  /* Public functions */

  self.convInputChange = convInputChange;

  self.hideEmoji = function () {
    $('.emojiContainer').hide();
    $('ion-content.has-footer').css('bottom', $('ion-footer-bar').height() + 'px');

    if ($state.is('conversation')) {
      $ionicScrollDelegate.$getByHandle('convMessages').scrollBottom(true);
    }
  };

  self.inputBack = function () {
    var cursorPos = $('#convInput').prop('selectionStart');
    var content = $('#convInput').val();

    var del = 2;

    // Check if caracter before carret is latin caracter
    if (!/[^\u0000-\u00ff]/.test(content.substr(cursorPos - 1, 1))) {
      del = 1;
    }

    $('#convInput').val(content.substr(0, cursorPos - del) + content.substr(cursorPos, content.length - cursorPos));
    scope.convInputChange();
  };

  self.insertEmoji = function (emoji) {
    var e = document.createElement('div');
    var cursorPos = $('#convInput').prop('selectionStart');
    var content = $('#convInput').val();

    e.innerHTML = emoji;

    $('#convInput').val(content.substr(0, cursorPos) + e.childNodes[0].nodeValue + content.substr(cursorPos, content.length - cursorPos));
    convInputChange();
  };

  self.resizeConvInput = resizeConvInput;

  self.sendSMS = function () {
    SmsManagerServ.sendSMS(SmsManagerServ.sendContact, $('#convInput').val());

    $('#convInput').val('');

    if ($state.is('conversation')) {
      slideUpEmoji();
    } else if ($state.is('newMessage')) {
      $ionicHistory.goBack();
    }
  };

  self.setScope = function (vscope) {
    scope = vscope;
  };

  self.slideUpEmoji = slideUpEmoji;

  self.toggleEmoji = function () {
    if ($('.emojiContainer').is(':visible')) {
      slideUpEmoji();
    } else {
      if (ionic.Platform.isAndroid() && cordova.plugins.Keyboard.isVisible) {
        window.addEventListener('native.keyboardhide', showEmoji);
      } else {
        showEmoji();
      }
    }
  };
});
