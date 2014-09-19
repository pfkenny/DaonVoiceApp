'use strict';

angular.module('daonVoiceAppApp')
  .controller('NavbarCtrl', function ($scope, $rootScope, $location, waitForAuth, firebaseRef, simpleLogin) {
    if(!$rootScope.logo)
    {
      $rootScope.logo = 'apple-touch-icon.png';
      $rootScope.companyName = 'Daon';
    }
    $scope.users = firebaseRef('users');

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

    waitForAuth.then(function() {
      $scope.currUserId = simpleLogin.getUserID();
      if ($scope.currUserId)
      {
        $scope.users.child($scope.currUserId).once('value', function(snapshot){
          var userProfile = snapshot.val();
          $scope.$apply(function () {
            $rootScope.logo = userProfile.avatar;
            $rootScope.companyName = userProfile.companyName;
          });
        });
      } else {
        $rootScope.logo = 'apple-touch-icon.png';
        $rootScope.companyName = 'Daon';
      }
    });
  });
