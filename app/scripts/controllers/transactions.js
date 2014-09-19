'use strict';

angular.module('daonVoiceAppApp')
  .controller('TransactionsCtrl', function ($scope, $timeout, Restangular, $modal, $log, firebaseRef, simpleLogin) {
	var baseTransactions = Restangular.all('api/transactions');
	$scope.transactions = [];
	$scope.filterOptions = {
		filterText: ''
	};
	$scope.polling = false;

	$scope.users = firebaseRef('users');
	$scope.currUserId = simpleLogin.getUserID();
	$scope.users.child($scope.currUserId).once('value', function(snapshot){
		var userProfile = snapshot.val();
		$scope.filterOptions.filterText = userProfile.mask;
		pollForTransactions();
	});

	//Function to poll rest resource and update the scope every second.
	function pollForTransactions() {
		$log.info('About to request transactions');
		baseTransactions.getList({filter:$scope.filterOptions.filterText}).then(function(transactions) {
			$log.info('Got transactions');
			$scope.transactions = transactions;
			baseTransactions = transactions;
			if (!$scope.polling)
			{
				$timeout(pollForTransactions, 1000);
				$scope.polling = true;
			}
		});
	}

	$scope.gridOptions = { data: 'transactions',
						   filterOptions: $scope.filterOptions,
						   columnDefs: [{field:'paymentNumber', displayName:'Payment #'},
										{field:'pps', displayName:'User ID'},
										{field:'firstName', displayName:'First Name'},
										{field:'secondName', displayName:'Last Name'},
										{field:'status', displayName:'Status', cellTemplate: 'partials/transactions/statusCellTemplate.html'},
										{field:'remove', displayName:'', cellTemplate: 'partials/transactions/removeTemplate.html'}
	]};

	$scope.removeRow = function() {
		$scope.transactions[this.row.rowIndex].remove().then(function(){
			baseTransactions.getList({filter:$scope.filterOptions.filterText}).then(function(transactions) {
				$scope.transactions = transactions;
			});
		});
		//$scope.transactions.splice(this.row.rowIndex,1);
	};

	$scope.open = function () {
		var modalInstance = $modal.open({
			templateUrl: 'partials/transactions/addTransaction.html',
			controller: 'AddTransactionCtrl',
			size: 'sm'
		});
		modalInstance.result.then(function (result) {
			$log.info('Transaction ' + result + ' at: ' + new Date());
			baseTransactions.getList({filter:$scope.filterOptions.filterText}).then(function(transactions) {
				$scope.transactions = transactions;
			});
		}, function (result) {
			$log.info('Modal ' + result + ' at: ' + new Date());
		});
	};
});

