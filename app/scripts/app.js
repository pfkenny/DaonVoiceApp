'use strict';

angular.module('daonVoiceAppApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'firebase',
  'simpleLoginTools',
  'angularfire.firebase',
  'angularfire.login',
  'restangular',
  'ngGrid'
])
  .config(function ($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      })
      .when('/transactions', {
        authRequired: true, // if true, must log in before viewing this page
        templateUrl: 'partials/transactions',
        controller: 'TransactionsCtrl'
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
    $httpProvider.defaults.headers.delete = { 'Content-Type': 'application/json;charset=utf-8' };
  });