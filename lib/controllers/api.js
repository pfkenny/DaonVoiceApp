'use strict';
var NodeRestClient = require('node-rest-client').Client;
var NodeCache = require("node-cache");
var Http = require('http');

var nodeRestClient = new NodeRestClient();
nodeRestClient.registerMethod("getTransactionsService", "http://ec2-54-73-156-93.eu-west-1.compute.amazonaws.com:9090/transaction-manager/services/transaction-service/adminService/getTransactions", "GET");
nodeRestClient.registerMethod("deleteTransactionService", "http://ec2-54-73-156-93.eu-west-1.compute.amazonaws.com:9090/transaction-manager/services/transaction-service/adminService/deleteTransaction/${id}", "POST");

var nodeCache = new NodeCache({ stdTTL: 5, checkperiod: 6 });


/**
Converts a list of parameters to forum data
- `fields` - a property map of key value pairs
- `files` - a list of property maps of content
  - `type` - the type of file data
  - `keyname` - the name of the key corresponding to the file
  - `valuename` - the name of the value corresponding to the file
  - `data` - the data of the file
*/
function getFormDataForPost(fields, files) {
  function encodeFieldPart(boundary,name,value) {
    var return_part = "--" + boundary + "\r\n";
    return_part += "Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n";
    return_part += value + "\r\n";
    return return_part;
  }
  function encodeFilePart(boundary,type,name,filename) {
    var return_part = "--" + boundary + "\r\n";
    return_part += "Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n";
    return_part += "Content-Type: " + type + "\r\n\r\n";
    return return_part;
  }
  var boundary = Math.random();
  var post_data = [];
 
  if (fields) {
    for (var key in fields) {
      var value = fields[key];
      post_data.push(new Buffer(encodeFieldPart(boundary, key, value), 'utf8'));
    }
  }
  if (files) {
    for (var fkey in files) {
      var fvalue = files[fkey];
      post_data.push(new Buffer(encodeFilePart(boundary, fvalue.type, fvalue.keyname, fvalue.valuename), 'utf8'));
      post_data.push(new Buffer(fvalue.data, 'utf8'));
    }
  }
  post_data.push(new Buffer("\r\n--" + boundary + "--", 'utf8'));
  var length = 0;
 
  for(var i = 0; i < post_data.length; i++) {
    length += post_data[i].length;
  }
  var params = {
    postdata : post_data,
    headers : {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': length
    }
  };
  return params;
}

/**
Sends a post form request via http
- `fields` - a property map of key value pairs
- `files` - a list of property maps of content
  - `type` - the type of file data
  - `keyname` - the name of the key corresponding to the file
  - `valuename` - the name of the value corresponding to the file
  - `data` - the data of the file
- `options` is a set of options
  - host
  - port
  - path
  - method
  - encoding
- `headers` headers to be sent with the request
- `callback` - callback to handle the response
*/
function postData(fields, files, options, headers, callback) {
  var headerparams = getFormDataForPost(fields, files);
  var totalheaders = headerparams.headers;
  for (var key in headers) totalheaders[key] = headers[key];

  var post_options = {
    host: options.host,
    port: options.port,
    path: options.path,
    method: options.method || 'POST',
    headers: totalheaders
  };
  var request = Http.request(post_options, function(response) {
    response.body = '';
    response.setEncoding(options.encoding);
    response.on('data', function(chunk){
      console.log(chunk);
      response.body += chunk;
    });
    response.on('end', function() {
      callback(null, response);
    });
  });
  request.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    callback('problem with request: ' + e.message, null);
  });
  for (var i = 0; i < headerparams.postdata.length; i++) {
    request.write(headerparams.postdata[i]);
  }
  request.end();
}

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

/**
 * Add a transaction to the Daon Proof of Life Server
 */
exports.addTransaction = function (req, res) {
  var transaction = req.body;
  var csv = transaction.paymentNumber + ',' + transaction.pps + ',' + transaction.idxPolicy;
  console.log('About to send transaction with data:' + csv);
  var options = {
    host : 'ec2-54-73-156-93.eu-west-1.compute.amazonaws.com',
    port : 9090,
    path : '/transaction-manager/services/transaction-service/adminService/upload',
    method : 'POST',
    encoding : 'utf8'
  };
  postData(null, [{type: 'application/vnd.ms-excel', keyname: 'file', valuename: 'transaction.csv', data: csv}], options, null, function(err, response) {
    console.log('Got the callback');
    if (!err && response.statusCode === 200)
    {
      console.log('Got no error');
      nodeCache.del( 'transactions' ); //Delete the transactions from the cache to force a refresh
      return res.json(transaction);
    } else {
      if(err) {
        console.log('addTransaction encontered an error : ' + err);
        return res.send(500, '');
      } else {
        console.log('addTransaction encountered got a http error : ' + response.statusCode);
        return res.send(response.statusCode, '');
      }
    }
  });
};
