'use strict';
var Firebase = require("firebase");
var twilio = require('twilio');
var Async = require('async');
var NodeRestClient = require('node-rest-client').Client;

var myRootRef = new Firebase('https://daon-voice-demo.firebaseio.com/');
var nodeRestClient = new Client();
nodeRestClient.registerMethod("getEnrolmentDataService", "http://ec2-54-73-156-93.eu-west-1.compute.amazonaws.com:9090/transaction-manager/services/transaction-service/adminService/getEnrolmentData/PPS_${id}", "GET");
nodeRestClient.registerMethod("verifyVoiceService", "http://ec2-54-73-156-93.eu-west-1.compute.amazonaws.com:9090/transaction-manager/services/verification-service/verificationService/verify/voice", "POST");

var getCustomerByAccountID = function(accountNumber, callback) {
    var myCustomerRef = myRootRef.child('customers/'+accountNumber);
    myCustomerRef.once('value', function(snapshot){
        var customer = snapshot.val();
        if (customer)
        {
          //If the customer is already in firebase then return it
          callback(customer);
        } else {
          //Otherwise get the customer from the Daon proof of life system
          var args = {
            path:{"id":accountNumber}
          };
          nodeRestClient.methods.getEnrolmentDataService(args,function(data,response){
            customer = {
              "dob" : {
                "date" : 1,
                "year" : 1980,
                "month" : 1
              },
              "registered" : true,
              "name" : {
                "last" : data.secondName,
                "first" : data.firstName
              },
              "pin" : parseInt(data.pin),
              "phone" : data.cell
            };
            //Add the customer to firebase
            var listRef = myRootRef.child('customers/');
            listRef.child(accountNumber).set(customer);
            //return the customer object
            callback(customer);
          });
        }
    });
};

var getInteractionByCallSid = function(callSid, callback) {
    var myInteractionRef = myRootRef.child('interactions/'+callSid);
    myInteractionRef.once('value', function(snapshot){
        var interaction = snapshot.val();
        callback(interaction);
    });
};

var getCustomerByCallSid = function(callSid, callback) {
  getInteractionByCallSid(callSid, function(interaction){
    if(interaction)
    {
      getCustomerByAccountID(interaction.account_number, function(customer){
        callback(customer);
      });
    } else {
      callback(null);
    }
  });
};

var enrollVoice = function(callSid, voiceUrl, callback) {
  callback(true);
};

var authenticateVoice = function(callSid, voiceUrl, callback) {
  nodeRestClient.get(voiceUrl, function(data, response){
    var voiceData = new Buffer(response).toString('base64');
    getInteractionByCallSid(callSid, function(interaction){
      if(interaction)
      {
        getCustomerByAccountID(interaction.account_number, function(customer){
          if (customer)
          {
            var userId = "PPS_" + interaction.account_number;
            var args = {
              data:{
                "pin":customer.pin,
                "userId": userId,
                "voiceSample" : voiceData
              }
            };
            nodeRestClient.methods.verifyVoiceService(args,function(data,response){
              callback(data.result);
            });
          } else {
            callback("Transaction authentication error");
          }
        });
      } else {
        callback("Transaction authentication error");
      }
    });
  });
};

exports.greet = function(req, res) {
  var respTwiml = new twilio.TwimlResponse();
  var baseURL = req.protocol + "://" + req.get('host');

  respTwiml.say('Welcome to dayon Social Services.', { voice:'woman', language:'en-gb'});

  respTwiml.gather({
        action:baseURL + '/api/daonvoice/isregistered',
        finishOnKey:'#',
        numDigits:'8',
        timeout:'10'
    }, function() {
        this.say('Please enter your eight digit account number.', { voice:'woman', language:'en-gb'} );
    });

    respTwiml.say('We did not receive any input. Goodbye!', {voice:'woman', language:'en-gb'});

    res.send(respTwiml);
};

exports.isregistered = function(req, res) {
  var baseURL = req.protocol + "://" + req.get('host');
  var respTwiml = new twilio.TwimlResponse();

  //Get Number
  var accountNumber = req.param("Digits");
  var callSid = req.param("CallSid");
  console.log("Got Account Number: " + accountNumber + " from call: " + callSid);
  if (accountNumber){
    //Retrieve record and handle error
    getCustomerByAccountID(accountNumber, function(customer){
      if (customer) {
        if (customer.registered === true)
        {
          respTwiml.gather({
                action:baseURL + '/api/daonvoice/verify',
                finishOnKey:'#',
                numDigits:'4',
                timeout:'10'
            }, function() {
                this.say('Hello ' + customer.name.first + ' ' + customer.name.last + ', please enter your four digit PIN.', { voice:'woman', language:'en-gb'} );
            });
            var listRef = myRootRef.child('interactions/');
          listRef.child(callSid).set({account_number: accountNumber, call_type: 'verification'});
        } else {
          respTwiml.gather({
                action:baseURL + '/api/daonvoice/register',
                finishOnKey:'#',
                numDigits:'4',
                timeout:'10'
            }, function() {
                this.say('Welcome ' + customer.name.first + ' ' + customer.name.last + '.  You are a new user so we must validate your details. Please enter the four digits of your year of birth.', { voice:'woman', language:'en-gb'} );
            });
            var listRef2 = myRootRef.child('interactions/');
          listRef2.child(callSid).set({account_number: accountNumber, call_type: 'registration'});
        }
        res.send(respTwiml);
      } else {
        respTwiml.say('The registration number was not valid!.', { voice:'woman', language:'en-gb'});
        //send back to greet
        respTwiml.redirect(baseURL + '/api/daonvoice/greet');
        res.send(respTwiml);
      }
    });
  } else {
    respTwiml.say('The registration number was not received!.', { voice:'woman', language:'en-gb'});
    //send back to greet
    respTwiml.redirect(baseURL + '/api/daonvoice/greet');
      res.send(respTwiml);
  }
};


exports.verify = function(req, res) {
  var baseURL = req.protocol + "://" + req.get('host');
  var respTwiml = new twilio.TwimlResponse();

  var customerPin = req.param("Digits");
  var callSid = req.param("CallSid");
  console.log("Got customer pin: " + customerPin + " from call: " + callSid);
  if (customerPin){
    //Retrieve record and handle error
    getCustomerByCallSid(callSid, function(customer){
      if (customer) {
        if (customer.pin === parseInt(customerPin))
        {
          respTwiml.say('Please say your identity X pass phrase after the beeb and then press hash.', { voice:'woman', language:'en-gb'});
          respTwiml.record({
                action:baseURL + '/api/daonvoice/verify2',
                finishOnKey:'#',
                playBeeb:'true',
                maxLength:'120',
                timeout:'20'
            });
            respTwiml.say('We could not hear the last four digits of your phone number. Please start again.', { voice:'woman', language:'en-gb'});
        } else {
          respTwiml.say('The customer pin was not correct!', { voice:'woman', language:'en-gb'});
          //send back to greet
          respTwiml.redirect(baseURL + '/api/daonvoice/greet');
            res.send(respTwiml);
        }
        res.send(respTwiml);
      } else {
        respTwiml.say('There was an application error!', { voice:'woman', language:'en-gb'});
        //send back to greet
        respTwiml.redirect(baseURL + '/api/daonvoice/greet');
          res.send(respTwiml);
      }
    });
  } else {
    respTwiml.say('The customer pin was not received!', { voice:'woman', language:'en-gb'});
    //send back to greet
    respTwiml.redirect(baseURL + '/api/daonvoice/greet');
      res.send(respTwiml);
  }
};

exports.verify2 = function(req, res) {
  var baseURL = req.protocol + "://" + req.get('host');
  var respTwiml = new twilio.TwimlResponse();

  var callSid = req.param("CallSid");
  var voiceUrl = req.param("RecordingUrl");
  var recordingDuration = req.param("RecordingDuration");
  if (recordingDuration > 0){
    //Retrieve record and handle error
    authenticateVoice(callSid, voiceUrl, function(authenticationResult)
    {
      if (authenticationResult === "Transaction successfully verified")
      {
        //now check the transcription
        var listRef = myRootRef.child('interactions/');
        listRef.child(callSid).set({overall_result: true});
        var custListRef = myRootRef.child('customers/');
        custListRef.child(listRef.child(callSid).account_number).set({last_verified: Date.now()});
        //TODO: set verified date on customer
        respTwiml.say('Your verification was successful your payment will be processed within the next 24 hours. Goodbye.', { voice:'woman', language:'en-gb'});
      } else {
        console.error('The Voice Sample could not be authenticated due to ' + authenticationResult);
        respTwiml.say('Your voice sample could not be authenticated. Please try again.', { voice:'woman', language:'en-gb'});
        //send back to greet
        respTwiml.redirect(baseURL + '/api/daonvoice/greet');
          res.send(respTwiml);
      }
    });
  } else {
    respTwiml.say('Your voice sample could not be authenticated. Please try again.', { voice:'woman', language:'en-gb'});
    //send back to greet
    respTwiml.redirect(baseURL + '/api/daonvoice/greet');
      res.send(respTwiml);
  }
};

exports.transcribe = function(req, res) {
  var baseURL = req.protocol + "://" + req.get('host');
  var respTwiml = new twilio.TwimlResponse();
  var callSid = req.param("CallSid");
  var transciptionText = req.param("TranscriptionText");
  var transcriptionStatus = req.param("TranscriptionStatus");
  console.log("Got transcribe callback with status: " + transcriptionStatus + " and value " + transciptionText + " and digits " + transciptionText.replace(/\D/g,'') + "' from call: " + callSid);
  getCustomerByCallSid(callSid, function(customer){
    if (customer) {
      //compare year of birth to digits
      //get pin and forwared to register2 to validate pin
      var lastPhoneDigits = customer.phone.substring(customer.phone.length-4,customer.phone.length);
      if (transcriptionStatus !== "completed")
      {
        console.log('Transcription failed to decipher the last four digits of the phone number.');
        //persist result
        var lr = myRootRef.child('interactions/');
        lr.child(callSid).set({transcription_result: false, transcription_text: transcriptionStatus});
      }
      else if (lastPhoneDigits === transciptionText.replace(/\D/g,''))
      {
        console.log('The last four digits of the phone number entered were correct!');
        //persist result
        var listRef = myRootRef.child('interactions/');
        listRef.child(callSid).set({transcription_result: true, transcription_text: transciptionText});
      }
      else
      {
        console.log('The last four digits of the phone number entered were not correct!');
        //persist result
        var listRef2 = myRootRef.child('interactions/');
        listRef2.child(callSid).set({transcription_result: false, transcription_text: transciptionText});
      }
      res.send(respTwiml);
    } else {
      console.error('There was an application error in the transcribe callback! - Could not load customer');
    }
  });
};

exports.register = function(req, res) {
  var baseURL = req.protocol + "://" + req.get('host');
  var respTwiml = new twilio.TwimlResponse();

  var yearOfBirth = req.param("Digits");
  var callSid = req.param("CallSid");
  console.log("Got Year Of Birth: " + yearOfBirth + " from call: " + callSid);
  if (yearOfBirth){
    //Retrieve record and handle error
    getCustomerByCallSid(callSid, function(customer){
      if (customer) {
        //compare year of birth to digits
        //get pin and forwared to register2 to validate pin
        if (customer.dob.year === parseInt(yearOfBirth))
        {
          respTwiml.gather({
                action:baseURL + '/api/daonvoice/register2',
                finishOnKey:'#',
                numDigits:'4',
                timeout:'10'
            }, function() {
                this.say('Please enter your four digit PIN.', { voice:'woman', language:'en-gb'} );
            });
        } else {
          console.log("Year of birth in registration of: " + customer.dob.year + " did not match the input of: " + yearOfBirth);
          respTwiml.say('The year of birth entered was not correct!', { voice:'woman', language:'en-gb'});
          //send back to greet
          respTwiml.redirect(baseURL + '/api/daonvoice/greet');
        }
        res.send(respTwiml);
      } else {
        respTwiml.say('There was an application error!', { voice:'woman', language:'en-gb'});
        //send back to greet
        respTwiml.redirect(baseURL + '/api/daonvoice/greet');
          res.send(respTwiml);
      }
    });
  } else {
    respTwiml.say('The year of birth was not received!', { voice:'woman', language:'en-gb'});
    //send back to greet
    respTwiml.redirect(baseURL + '/api/daonvoice/greet');
      res.send(respTwiml);
  }
};

exports.register2 = function(req, res) {
  var baseURL = req.protocol + "://" + req.get('host');
  var respTwiml = new twilio.TwimlResponse();

  var customerPin = req.param("Digits");
  var callSid = req.param("CallSid");
  console.log("Got customer pin: " + customerPin + " from call: " + callSid);
  if (customerPin){
    //Retrieve record and handle error
    getCustomerByCallSid(callSid, function(customer){
      if (customer) {
        //compare year of birth to digits
        //get pin and forwared to register2 to validate pin
        if (customer.pin === parseInt(customerPin))
        {
          respTwiml.say('Please say the last four digits of your registered phone number after the beep and then press hash.', { voice:'woman', language:'en-gb'});
          respTwiml.record({
                action:baseURL + '/api/daonvoice/register3',
                finishOnKey:'#',
                playBeeb:'true',
                maxLength:'120',
                timeout:'20',
                transcribeCallback:baseURL + '/api/daonvoice/transcribe'
            });
            respTwiml.say('We could not hear the last four digits of your phone number. Please start again.', { voice:'woman', language:'en-gb'});
        } else {
          respTwiml.say('The customer pin was not correct!', { voice:'woman', language:'en-gb'});
          //send back to greet
          respTwiml.redirect(baseURL + '/api/daonvoice/greet');
            res.send(respTwiml);
        }
        res.send(respTwiml);
      } else {
        respTwiml.say('There was an application error!', { voice:'woman', language:'en-gb'});
        //send back to greet
        respTwiml.redirect(baseURL + '/api/daonvoice/greet');
          res.send(respTwiml);
      }
    });
  } else {
    respTwiml.say('The customer pin was not received!', { voice:'woman', language:'en-gb'});
    //send back to greet
    respTwiml.redirect(baseURL + '/api/daonvoice/greet');
      res.send(respTwiml);
  }
};

exports.register3 = function(req, res) {
  var baseURL = req.protocol + "://" + req.get('host');
  var respTwiml = new twilio.TwimlResponse();

  var callSid = req.param("CallSid");
  var voiceUrl = req.param("RecordingUrl");
  var recordingDuration = req.param("RecordingDuration");
  if (recordingDuration > 0){
    //Check the transcription
    var wait = 0;
    var timeout = 10;
    var got_transcription = false;
    var transcription_result;

    Async.until(
        function () { return ((wait < timeout)||(got_transcription)); },
        function (callback) {
          getInteractionByCallSid(callSid, function(interaction){
          if(interaction)
          {
            transcription_result = interaction.transcription_result;
            got_transcription = true;
          } else {
            callback(null);
          }
        });
            wait++;
            setTimeout(callback, 1000);
        },
        function (err) {
          if(got_transcription)
          {
            if (transcription_result)
            {
              enrollVoice(callSid, voiceUrl, function(isEnrolled)
            {
              if (isEnrolled)
              {
                getInteractionByCallSid(callSid, function(interaction){
                  if(interaction)
                  {
                    var listRef = myRootRef.child('customers/');
                    listRef.child(interaction.account_number).set({registered: true});
                      respTwiml.say('Your registraton was successful. Please call again to verify, goodbye.', { voice:'woman', language:'en-gb'});
                      res.send(respTwiml);
                  } else {
                    console.error("Could not find registraton using callSID: " + callSid);
                    respTwiml.say('Your voice sample could not be enrolled. Please try again.', { voice:'woman', language:'en-gb'});
                    //send back to greet
                    respTwiml.redirect(baseURL + '/api/daonvoice/greet');
                      res.send(respTwiml);
                  }
                });
              } else {
                respTwiml.say('Your voice sample could not be enrolled. Please try again.', { voice:'woman', language:'en-gb'});
                //send back to greet
                respTwiml.redirect(baseURL + '/api/daonvoice/greet');
                  res.send(respTwiml);
              }
            });
            } else {
              console.error("Transcription text not correct.");
              respTwiml.say('Your voice sample could not be enrolled. Please try again.', { voice:'woman', language:'en-gb'});
            //send back to greet
            respTwiml.redirect(baseURL + '/api/daonvoice/greet');
              res.send(respTwiml);
            }
          } else {
            console.error("Transcription was not received.");
          respTwiml.say('Your voice sample could not be enrolled. Please try again.', { voice:'woman', language:'en-gb'});
          //send back to greet
          respTwiml.redirect(baseURL + '/api/daonvoice/greet');
            res.send(respTwiml);
          }
        }
    );
  } else {
    respTwiml.say('Your voice sample could not be enrolled. Please try again.', { voice:'woman', language:'en-gb'});
    //send back to greet
    respTwiml.redirect(baseURL + '/api/daonvoice/greet');
      res.send(respTwiml);
  }
};
