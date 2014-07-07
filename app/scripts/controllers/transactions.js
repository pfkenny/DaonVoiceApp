'use strict';

angular.module('daonVoiceAppApp')
  .controller('TransactionsCtrl', function ($scope, $timeout, Restangular) {
	var baseTransactions = Restangular.all('api/transactions');
	$scope.transactions = [];

	//Function to poll rest resource and update the scope every second.
	(function tick() {
		baseTransactions.getList().then(function(transactions) {
		  $scope.transactions = transactions;
		  $timeout(tick, 1000);
		});
	})();

	$scope.gridOptions = { data: 'transactions',
						   columnDefs: [{field:'paymentNumber', displayName:'Trans ID'},
										{field:'pps', displayName:'User ID'},
										{field:'firstName', displayName:'First Name'},
										{field:'secondName', displayName:'Last Name'},
										{field:'status', displayName:'Status', cellTemplate: 'partials/transactions/statusCellTemplate.html'},
										{field:'remove', displayName:'', cellTemplate: 'partials/transactions/removeTemplate.html'}
	]};

	$scope.removeRow = function() {
		$scope.transactions[this.row.rowIndex].remove().then(function(){
			baseTransactions.getList();
		});
		$scope.transactions.splice(this.row.rowIndex,1);
	};
});
