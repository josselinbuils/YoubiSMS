'use strict';

angular.module('main').service('SmsManager', function ($ionicPlatform, $window, _, $cordovaContacts, localStorageService, $log) {

  /* Private variables */

  var self = this;

  /* Public variables */

  self.conversations = [];

  /* Private functions */

  function cleanMessage(message) {
    /* jshint camelcase: false */
    return {
      address: message.address,
      body: message.body,
      date: message.date,
      dateSent: message.date_sent,
      read: message.read,
      type: message.type
    };
  }

  function updateConversations(callback) {
    var numbers = {};

    var options = new $window.ContactFindOptions();
    options.multiple = true;

    $cordovaContacts.find(options).then(function (contacts) {
      $log.debug('SMSManager->$cordovaContacts: ' + contacts.length + ' contacts received.');

      _.each(contacts, function (contact, i) {
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          _.each(contact.phoneNumbers, function (phoneNumber) {
            if ($window.isValidNumber(phoneNumber.value, 'FR')) {
              numbers[$window.formatE164('FR', phoneNumber.value)] = i;
            }
          });
        }
      });

      var conversations = [];

      $window.SMS.listSMS({
        box: '',
        maxCount: 2000
      }, function (messages) {
        console.log(messages);
        $log.debug('SMSManager->SMS: ' + messages.length + ' messages received.');

        var conversNumbers = [];

        _.each(messages, function (message) {
          if ($window.isValidNumber(message.address, 'FR')) {
            message.address = $window.formatE164('FR', message.address);
          }

          var i = _.indexOf(conversNumbers, message.address);

          if (i === -1) {
            var contactIndex = numbers[message.address];

            conversations.push({
              contactName: contactIndex ? contacts[contactIndex].displayName : message.address,
              contactPhoto: contactIndex && contacts[contactIndex].photos && contacts[contactIndex].photos.length > 0 ? contacts[contactIndex].photos[0].value : 'main/assets/images/yo@2x.png',
              number: message.address,
              messages: [ cleanMessage(message) ]
            });
            conversNumbers.push(message.address);
          } else {
            conversations[i].messages.push(cleanMessage(message));
          }
        });

        self.conversations = conversations;
        localStorageService.set('conversations', conversations);
        $log.debug('SMSManager: ' + conversations.length + ' conversations stored.');

        if (callback) {
          callback();
        }
      });
    });
  }

  /* Public functions */

  self.init = function (scope) {
    $log.debug('SMSManager->init()');

    if (localStorageService.get('conversations')) {
      self.conversations = localStorageService.get('conversations');
      console.log(self.conversations);
      $log.debug('SMSManager: ' + self.conversations.length + ' stored conversations loaded.');
    }

    scope.$applyAsync();

    _.defer(function () {
      $log.debug('SMSManager->updateConversations()');

      updateConversations(function () {
        $log.debug('SMSManager: conversations updated.');
        scope.$applyAsync();
      });
    });
  };
});
