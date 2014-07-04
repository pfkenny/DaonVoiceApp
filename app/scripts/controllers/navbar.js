'use strict';

angular.module('daonVoiceAppApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [{
      'title': 'Accounts',
      'link': '/accounts',
      'state' : 'login'
    },{
      'title': 'Transactions',
      'link': '/transactions',
      'state' : 'login'
    }];
    
    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
