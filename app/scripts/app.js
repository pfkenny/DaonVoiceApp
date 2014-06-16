'use strict';

angular.module('daonVoiceAppApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'firebase',
  'angularfire.firebase',
  'angularfire.login',
  'simpleLoginTools'
])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      })
      .when('/accounts', {
        authRequired: true, // if true, must log in before viewing this page
        templateUrl: 'partials/accounts',
        controller: 'AccountsCtrl'
      })
      .when('/login', {
        authRequired: false, // if true, must log in before viewing this page
        templateUrl: 'partials/login',
        controller: 'LoginController'
      })
      .otherwise({
        redirectTo: '/'
      });
      
    $locationProvider.html5Mode(true);
  });