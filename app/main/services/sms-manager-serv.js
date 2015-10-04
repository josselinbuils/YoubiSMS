'use strict';

angular.module('main').service('SmsManagerServ', function ($ionicPlatform, $log, $q, $rootScope, localStorageService, WebRtcServ) {

  /* Private variables */

  var contactNumbersDeferred, messagesDeferred;
  var self = this;

  /* Public variables */

  self.contactNumbers = [];
  self.contactThumbnails = {};
  self.convThumbnails = {};
  self.conversations = [];
  self.defaultUserPicture = 'main/assets/images/user.png';
  self.sendContact = '';

  /* Private functions */

  function getContactThumbnail(contactId, callback) {
    $log.debug('SMSManager->getContactThumbnail(' + contactId + ')');

    if (!self.contactThumbnails[contactId]) {

      if (ionic.Platform.isAndroid()) {

        SMSManager.getContactThumbnail({
          id: contactId
        }, function (data) {
          $log.debug('SmsManagerServ: thumbnail of contact ' + contactId + ' loaded.');

          self.contactThumbnails[contactId] = data || self.defaultUserPicture;

          if (callback) {
            callback();
          }

          $rootScope.$broadcast('SmsManagerServ.contactThumbnailLoaded');
        });

      } else {
        WebRtcServ.send({
          key: 'getContactThumbnail',
          data: contactId
        });
      }
    } else {
      if (callback) {
        callback();
      }
    }
  }

  function getConvThumbnails() {
    $log.debug('SMSManager->getConvThumbnails()');

    var neededConvIds = [];

    self.conversations.forEach(function (conversation) {
      if (!self.convThumbnails[conversation.id]) {
        var contact = conversation.contacts && conversation.contacts[0] ? conversation.contacts[0] : null;

        if (contact && contact.hasPhoto) {

          if (ionic.Platform.isAndroid()) {
            SMSManager.getContactThumbnail({
              id: contact.id
            }, function (data) {
              $log.debug('SmsManagerServ: thumbnail of conversation ' + conversation.id + ' loaded.');
              self.convThumbnails[conversation.id] = data || self.defaultUserPicture;
              $rootScope.$broadcast('SmsManagerServ.convThumbnailLoaded');
            });
          } else {
            neededConvIds.push(conversation.id);
          }
        } else {
          self.convThumbnails[conversation.id] = self.defaultUserPicture;
        }
      }
    });

    if (!ionic.Platform.isAndroid()) {
      WebRtcServ.send({
        key: 'getConvThumbnails',
        data: neededConvIds
      });
    }
  }

  function sendContactThumbnail(contactId) {
    $log.debug('SMSManager->sendContactThumbnail(' + contactId + ')');

    getContactThumbnail(contactId, function () {
      WebRtcServ.send({
        key: 'contactThumbnail',
        data: {
          id: contactId,
          thumbnail: self.contactThumbnails[contactId]
        }
      });
    });
  }

  function sendConvThumbnails(convIds) {
    $log.debug('SMSManager->sendConvThumbnails()');

    convIds.forEach(function (convId) {
      WebRtcServ.send({
        key: 'convThumbnail',
        data: {
          id: convId,
          thumbnail: self.convThumbnails[convId]
        }
      });
    });
  }

  function updateConversations() {
    $log.debug('SMSManager->updateConversations()');

    if (ionic.Platform.isAndroid()) {
      SMSManager.getConversations(function (conversations) {
        self.conversations = conversations;
        localStorageService.set('conversations', conversations);

        $log.debug('SmsManagerServ: ' + conversations.length + ' conversations stored.');

        getConvThumbnails();

        $rootScope.$broadcast('SmsManagerServ.conversationsUpdated');

        if (WebRtcServ.hasConnection()) {
          WebRtcServ.send({
            key: 'conversations',
            data: self.conversations
          });
        }
      });
    } else {
      WebRtcServ.send({
        key: 'getConversations'
      });
    }
  }

  /* Public functions */

  self.deleteConversation = function (id) {
    if (id) {
      $log.debug('SmsManagerServ: deleting conversation ' + id + '.');

      if (ionic.Platform.isAndroid()) {
        SMSManager.deleteConversation({
          id: id
        }, function () {
          $log.debug('SmsManagerServ: conversation ' + id + ' deleted.');
          updateConversations();
        });
      } else {
        WebRtcServ.send({
          key: 'deleteConversation',
          data: {
            id: id
          }
        });
      }
    }
  };

  self.getContactNumbers = function () {
    $log.debug('NewMessageCtrl->getContactNumbers()');

    contactNumbersDeferred = $q.defer();

    if (ionic.Platform.isAndroid()) {

      if (self.contactNumbers.length === 0) {

        var options = new window.ContactFindOptions();
        options.multiple = true;

        navigator.contacts.find(['*'], function (contacts) {
          $log.debug('NewMessageCtrl: ' + contacts.length + ' contacts received.');

          if (contacts && contacts.length > 0) {

            contacts.forEach(function (contact) {
              if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {

                contact.phoneNumbers.forEach(function (phoneNumber) {
                  if (contact.id && contact.displayName && window.isValidNumber(phoneNumber.value, 'FR')) {
                    var type = phoneNumber.type;

                    switch (type) {
                      case 'custom':
                        type = 'Autre';
                        break;
                      case 'home':
                        type = 'Domicile';
                        break;
                      case 'mobile':
                        type = 'Mobile';
                        break;
                      case 'work':
                        type = 'Travail';
                        break;
                    }

                    self.contactNumbers.push({
                      contactHasPhoto: contact.photos && contact.photos.length > 0 ? true : false,
                      contactId: contact.id,
                      contactName: contact.displayName,
                      local: window.formatLocal('FR', phoneNumber.value),
                      phoneNumber: window.formatE164('FR', phoneNumber.value),
                      type: type
                    });
                  }
                });
              }
            });
          }

          $log.debug('NewMessageCtrl: ' + self.contactNumbers.length + ' contact numbers formated.');
          contactNumbersDeferred.resolve();

        }, null, options);
      } else {
        $log.debug('NewMessageCtrl: contact numbers have already been formated.');
        contactNumbersDeferred.resolve();
      }
    } else {
      WebRtcServ.send({
        key: 'getContactNumbers'
      });
    }

    return contactNumbersDeferred.promise;
  };

  self.getContactPhoto = function (contact, callback) {
    $log.debug('SMSManager->getContactPhoto()');

    var randomPhoto = 'main/assets/images/photos/' + Math.floor((Math.random() * 11) + 1) + '.jpg';

    if (contact.hasPhoto) {
      if (ionic.Platform.isAndroid()) {
        SMSManager.getContactPhoto({
          id: contact.id
        }, function (data) {
          $log.debug('SmsManagerServ: photo of contact ' + contact.id + ' loaded.');
          callback(data || randomPhoto);
        });
      } else {
        WebRtcServ.send({
          key: 'getContactPhoto',
          data: contact
        });
      }
    } else {
      callback(randomPhoto);
    }
  };

  self.getContactThumbnails = function (numbers) {
    $log.debug('SMSManager->getContactThumbnails()');

    numbers.forEach(function (number) {
      if (!self.contactThumbnails[number.contactId]) {
        getContactThumbnail(number.contactId);
      }
    });
  };

  self.getConversation = function (id) {
    return _.find(self.conversations, {
      id: id
    });
  };

  self.getMessages = function (id) {
    if (id) {
      $log.debug('SMSManager->getMessages(' + id + ')');

      messagesDeferred = $q.defer();

      if (ionic.Platform.isAndroid()) {

        SMSManager.getConvMessages({
          id: id
        }, function (messages) {
          $log.debug('SmsManagerServ: ' + messages.length + ' messages received.');
          messagesDeferred.resolve(messages);

          console.log(messages);
        });

      } else {
        WebRtcServ.send({
          key: 'getMessages',
          data: {
            id: id
          }
        });
      }

      return messagesDeferred.promise;
    }
  };

  self.init = function () {
    $log.debug('SMSManager->init()');

    if (ionic.Platform.isAndroid()) {

      if (localStorageService.get('conversations')) {
        self.conversations = localStorageService.get('conversations');
        $log.debug('SmsManagerServ: ' + self.conversations.length + ' stored conversations loaded.');

        getConvThumbnails();
      }

      SMSManager.listenLogs(function (log) {
        $log.debug('SMSManagerPlugin: ' + log);
      }, function (log) {
        $log.error('SMSManagerPlugin: ' + log);
      });

      SMSManager.listenEvents(function (event) {
        $log.debug('SmsManagerServ: event received : ' + event + '.');

        switch (event) {

          case 'dataUpdated':
            $rootScope.$broadcast('SmsManagerServ.dataUpdated');

            if (WebRtcServ.hasConnection()) {
              WebRtcServ.send({
                key: 'dataUpdated'
              });
            }

            updateConversations();
            break;

          case 'messageReceived':
            $rootScope.$broadcast('SmsManagerServ.messageReceived');

            if (WebRtcServ.hasConnection()) {
              WebRtcServ.send({
                key: 'messageReceived'
              });
            }

            updateConversations();
            break;
        }
      });

      _.defer(function () {
        updateConversations();
      });
    }
  };

  self.sendSMS = function (phoneNumber, body) {
    if (phoneNumber && phoneNumber.length > 0 && body && body.length > 0) {
      $log.debug('SmsManagerServ->sendSMS()');

      if (ionic.Platform.isAndroid()) {

        SMSManager.sendSMS({
          phoneNumber: phoneNumber,
          body: body
        });

      } else {
        WebRtcServ.send({
          key: 'sendSMS',
          data: {
            phoneNumber: phoneNumber,
            body: body
          }
        });
      }
    } else {
      $log.error('SmsManagerServ->sendSMS(' + phoneNumber + ', ' + body + ')->error: invalid parameters.');
    }
  };

  /* WebRtcServ client events */

  $rootScope.$on('WebRtcServ.connectedToPhone', function () {
    $log.debug('SmsManagerServ: WebRtcServ.connectedToPhone event received.');
    updateConversations();
  });

  $rootScope.$on('WebRtcServ.dataReceivedFromPhone', function (e, input) {
    switch (input.key) {

      case 'contactNumbers':
        $log.debug('SmsManagerServ: ' + input.data.length + ' numbers received.');

        self.contactNumbers = input.data;

        contactNumbersDeferred.resolve();
        break;

      case 'contactPhoto':
        $log.debug('SmsManagerServ: contact photo received.');
        $rootScope.$broadcast('SmsManagerServ.contactPhotoReceived', input.data);
        break;

      case 'contactThumbnail':
        $log.debug('SmsManagerServ: thumbnail of contact ' + input.data.id + ' received.');

        self.contactThumbnails[input.data.id] = input.data.thumbnail;

        $rootScope.$broadcast('SmsManagerServ.contactThumbnailReceived');
        break;

      case 'conversation':
        $log.debug('SmsManagerServ: ' + input.data.length + ' messages received.');
        messagesDeferred.resolve(input.data);
        break;

      case 'conversations':
        $log.debug('SmsManagerServ: ' + input.data.length + ' conversations received.');

        self.conversations = input.data;

        getConvThumbnails();

        $rootScope.$broadcast('SmsManagerServ.conversationsUpdated');
        break;

      case 'convThumbnail':
        $log.debug('SmsManagerServ: thumbnail of conversation ' + input.data.id + ' received.');

        self.convThumbnails[input.data.id] = input.data.thumbnail || self.defaultUserPicture;

        $rootScope.$broadcast('SmsManagerServ.convThumbnailReceived');
        break;

      case 'dataUpdated':
        $log.debug('SmsManagerServ: data updated.');

        $rootScope.$broadcast('SmsManagerServ.dataUpdated');

        updateConversations();
        break;

      case 'messageReceived':
        $log.debug('SmsManagerServ: message received.');

        new window.Audio('main/assets/sounds/message.wav').play();

        $rootScope.$broadcast('SmsManagerServ.messageReceived');
        break;

      default:
        $log.debug('SmsManagerServ: key of received data unknown.');
    }
  });

  $rootScope.$on('WebRtcServ.messageSent', function () {
    updateConversations();
  });

  /* WebRtcServ phone events */

  $rootScope.$on('WebRtcServ.dataReceivedFromClient', function (e, input) {
    switch (input.key) {

      case 'deleteConversation':
        self.deleteConversation(input.data.id);
        break;

      case 'getContactNumbers':
        self.getContactNumbers().then(function () {
          WebRtcServ.send({
            key: 'contactNumbers',
            data: self.contactNumbers
          });
        });
        break;

      case 'getContactPhoto':
        self.getContactPhoto(input.data, function (photo) {
          WebRtcServ.send({
            key: 'contactPhoto',
            data: photo
          });
        });
        break;

      case 'getContactThumbnail':
        sendContactThumbnail(input.data);
        break;

      case 'getConvThumbnails':
        sendConvThumbnails(input.data);
        break;

      case 'getMessages':
        self.getMessages(input.data.id).then(function (messages) {
          WebRtcServ.send({
            key: 'conversation',
            data: messages
          });
        });
        break;

      case 'getConversations':
        updateConversations();
        break;

      case 'sendSMS':
        self.sendSMS(input.data.phoneNumber, input.data.body);
        break;
    }
  });
});
