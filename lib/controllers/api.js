'use strict';
var NodeRestClient = require('node-rest-client').Client;
var NodeCache = require("node-cache");

var nodeRestClient = new NodeRestClient();
nodeRestClient.registerMethod("getTransactionsService", "http://ec2-54-73-156-93.eu-west-1.compute.amazonaws.com:9090/transaction-manager/services/transaction-service/adminService/getTransactions", "GET");
nodeRestClient.registerMethod("deleteTransactionService", "http://ec2-54-73-156-93.eu-west-1.compute.amazonaws.com:9090/transaction-manager/services/transaction-service/adminService/deleteTransaction/${id}", "POST");

var nodeCache = new NodeCache({ stdTTL: 5, checkperiod: 6 });

/**
 * Get awesome things
 */
exports.awesomeThings = function(req, res) {
  res.json([
    {
      name : 'HTML5 Boilerplate',
      info : 'HTML5 Boilerplate is a professional front-end template for building fast, robust, and adaptable web apps or sites.',
      awesomeness: 10
    }, {
      name : 'AngularJS',
      info : 'AngularJS is a toolset for building the framework most suited to your application development.',
      awesomeness: 10
    }, {
      name : 'Karma',
      info : 'Spectacular Test Runner for JavaScript.',
      awesomeness: 10
    }, {
      name : 'Express',
      info : 'Flexible and minimalist web application framework for node.js.',
      awesomeness: 10
    }
  ]);
};

/**
 * Get transactions from the Daon Proof of Life Server
 */
exports.transactions = function (req, res) {
  var value = nodeCache.get('transactions'); //Check local cache first
  if(value && value.transactions)
  {
    res.json(value.transactions);
  } else {
    nodeRestClient.methods.getTransactionsService(function(data,response){
      nodeCache.set('transactions', data, 5); //Save to Cache with 5sec TTL
      res.json(data);
    });
  }
};

/**
 * Delete a transaction from the Daon Proof of Life Server
 */
exports.deleteTransaction = function (req, res) {
  var transaction = req.body;
  console.log(req.body);
  var iidToDelete = transaction.iid;
  //Otherwise get the customer from the Daon proof of life system
  var args = {
    path:{"id":iidToDelete}
  };
  console.log("About to delete transaction with id: " + iidToDelete);
  nodeRestClient.methods.deleteTransactionService(args,function(data,response){
    res.status = response.status;
    nodeCache.del( 'transactions' ); //Delete the transactions from the cache to force a refresh
    return res.send('');
  });
};
