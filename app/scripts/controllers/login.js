'use strict';

angular.module('daonVoiceAppApp')
  .controller('LoginController', function($scope, simpleLogin) {

    $scope.pass = null;
    $scope.err = null;
    $scope.email = null;
    $scope.confirm = null;
    $scope.companyDisplayName = null;
    $scope.createMode = false;
    $scope.registerMode = false;
    $scope.regCode = null;
    $scope.fileRef = null;
    $scope.loginPassword = function(cb) {
      $scope.err = null;
      if( !$scope.email ) {
        $scope.err = 'Please enter an email address';
      }
      else if( !$scope.pass ) {
        $scope.err = 'Please enter a password';
      }
      else {
        simpleLogin.loginPassword($scope.email, $scope.pass, function(err, user) {
          $scope.err = err? err + '' : null;
          if( !err && cb ) {
            cb(user);
          }
        });
      }
    };

    $scope.logout = simpleLogin.logout;

    $scope.validateRegCode = function() {
      if($scope.regCode === 'DaonP0L') {
        $scope.registerMode = true;
      }
    };

    $scope.createAccount = function() {
      function assertValidLoginAttempt() {
        if( !$scope.email ) {
          $scope.err = 'Please enter an email address';
        }
        else if( !$scope.pass ) {
          $scope.err = 'Please enter a password';
        }
        else if( !$scope.companyDisplayName ) {
          $scope.err = 'Please enter a company name';
        }
        else if( $scope.pass !== $scope.confirm ) {
          $scope.err = 'Passwords do not match';
        }
        else if( !$scope.fileRef ) {
          $scope.err = 'Please upload a logo.';
        }
        return !$scope.err;
      }

      $scope.err = null;
      if( assertValidLoginAttempt() ) {
        simpleLogin.createAccount($scope.email, $scope.pass, function(err, user) {
          if( err ) {
            $scope.err = err? err + '' : null;
          } else {
            var createdUser = user;
            createdUser = createdUser;
            simpleLogin.loginPassword($scope.email, $scope.pass, function(loginErr, LoggedInUser) {
              if (loginErr) {
                $scope.err = loginErr? loginErr + '' : null;
              } else {
                simpleLogin.createProfile(LoggedInUser.uid, LoggedInUser.email, $scope.fileRef, $scope.companyDisplayName);
              }
            });
          }
        });
      }
    };

  });
