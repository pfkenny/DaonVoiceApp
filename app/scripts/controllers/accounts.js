'use strict';

angular.module('daonVoiceAppApp')
  .controller('AccountsCtrl', function ($scope, $http, firebaseRef, syncData, orderByPriorityFilter) {
	syncData('customers').$bind($scope, 'data');
	$scope.myData = firebaseRef('customers');
	$scope.$watchCollection('data', function() {
	  $scope.myData = orderByPriorityFilter($scope.data);
	});

	$scope.gridOptions = { data: 'myData',
						   columnDefs: [{field:'$id', displayName:'ID'},
										{field:'name.first', displayName:'First Name'},
										{field:'name.last', displayName:'Last Name'},
										{field:'phone', displayName:'Phone'}
	]};
});
