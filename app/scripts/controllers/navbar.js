'use strict';

angular.module('daonVoiceAppApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
      'title': 'Accounts',
      'link': '/accounts'
    }];
    
    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
