'use strict';

angular.module('daonVoiceAppApp')
  .controller('AddTransactionCtrl', function ($scope, $modalInstance, $log, Restangular, firebaseRef, simpleLogin) {
  var baseTransactions = Restangular.all('api/transactions');

  $scope.policies = ['Pol-Open', 'Pol-Voice', 'Pol-Face', 'Pol-Voice-Face', 'Pol-FaceG'];
  $scope.users = firebaseRef('users');
  $scope.currUserId = simpleLogin.getUserID();
  $scope.newTransactionInput = {txuserid: '', idxpolicy: 'Pol-Open'};
  $scope.addTransactionProcessing = {status: false};

  $scope.ok = function () {
    $scope.addTransactionProcessing.status = true;
    $scope.users.child($scope.currUserId).once('value', function(snapshot){
      var userProfile = snapshot.val();
      var timestamp = new Date();
      var paymentNum = userProfile.mask + timestamp.getTime();
      var newTransaction = {paymentNumber: paymentNum, pps: $scope.newTransactionInput.txuserid, idxPolicy: $scope.newTransactionInput.idxpolicy};
      baseTransactions.post(newTransaction).then(function() {
        $log.info('Object saved OK');
        $scope.addTransactionProcessing.status = false;
        $modalInstance.close('added');
      }, function() {
        $log.info('There was an error saving');
        $scope.addTransactionProcessing.status = false;
        $modalInstance.close('error');
      });
    });
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});
