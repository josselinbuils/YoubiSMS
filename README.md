# YoubiSMS
>YoubiSMS is an sms app for android which allow to access sms from others devices.

## Dependencies
YoubiSMS need the following dependencies:
- Android SDK (API 22)
- Bower
- Cordova
- Git
- Gulp
- Ionic
- Java JDK
- NodeJS
- XCode (Mac only)

## Environment installation
```
git clone https://github.com/josselinbuils/YoubiSMS.git
cd YoubiSMS
npm install
bower install
ionic platform add android
Copy drawables to platforms/android/res/drawable
cordova plugin add ionic-plugin-keyboard
cordova plugin add https://github.com/josselinbuils/SMSManager.git
cordova plugin add https://github.com/VersoSolutions/CordovaClipboard.git
cordova plugin add org.apache.cordova.contacts
cordova plugin add org.apache.cordova.statusbar
```

## Build
```
gulp --cordova 'run android'
```

## Remove and add local SMSManager
```
cordova plugin remove com.josselinbuils.SMSManager
cordova plugin add [path]
```