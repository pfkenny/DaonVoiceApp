'use strict';

angular.module('daonVoiceAppApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/',
      'state': 'logout,error,login'
    },{
      'title': 'Accounts',
      'link': '/accounts',
      'state' : 'login'
    }];
    
    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
