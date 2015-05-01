'use strict';

angular.module('main').directive('noSwipeScroll', function ($ionicScrollDelegate) {
  return {
    restrict: 'EA',
    link: function (scope, element) {
      var startX, startY, isDown = false;
      element.bind('mousedown touchstart', function (e) {
        startX = e.clientX;
        startY = e.clientY;
        isDown = true;
      });

      element.bind('mousemove touchmove', function (e) {
        if (isDown) {
          var deltaX = Math.abs(e.clientX - startX), deltaY = Math.abs(e.clientY - startY);

          if (deltaX > deltaY) {
            $ionicScrollDelegate.freezeScroll(true);
          }
        }
      });

      element.bind('mouseup touchend', function () {
        isDown = false;
        $ionicScrollDelegate.freezeScroll(false);
      });
    }
  };
});
