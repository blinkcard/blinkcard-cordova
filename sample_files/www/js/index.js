/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        
        var resultDiv = document.getElementById('resultDiv');

        var documentFirstImageDiv = document.getElementById('documentFirstImageDiv');
        var documentFirstImage = document.getElementById('documentFirstImage');

        var documentSecondImageDiv = document.getElementById('documentSecondImageDiv');
        var documentSecondImage = document.getElementById('documentSecondImage');

        documentFirstImageDiv.style.visibility = "hidden";
        documentSecondImageDiv.style.visibility = "hidden";

        // BlinkCardRecognizer automatically classifies different credit card types and scans the data from
        // the supported credit card
        var blinkCardRecognizer = new cordova.plugins.BlinkCard.BlinkCardRecognizer();
        blinkCardRecognizer.returnFullDocumentImage = true;

        // there are lots of Recognizer objects in BlinkCard - check blinkCardScanner.js for full reference

        var blinkcardOverlaySettings = new cordova.plugins.BlinkCard.BlinkCardOverlaySettings();

        // create RecognizerCollection from any number of recognizers that should perform recognition
        var recognizerCollection = new cordova.plugins.BlinkCard.RecognizerCollection([blinkCardRecognizer]);

        // package name/bundleID com.microblink.sample
        var licenseKeys = {
            android: 'sRwAAAAVY29tLm1pY3JvYmxpbmsuc2FtcGxlU9kJdZhZkGlTu9U3PWNHZAAPMfggO8eqRqstS/pzAj03JIRM4oKtZHC3x01wMUK/j4ZjCEdfIGTcuaz8sIaJY3rE/o43J+8GQMgTkoKu3qCjqowrQgNT6JqiD7Vkth1TDhdjv3bJq5BmewGdyJzVnT8yk+wCV8XBqqY4dJozSfZRgmgAp2O/WnXfveCTpHqnHjH50fCLTgertIHJs6ekk8FxHtWKkoiXixZnkLppqxjn1bc4l51VAaXaf+HhlAYSYVgQZJpk+n8CtNfemcGHw4sNq2xYGQ1o4cZVjhJEOCuP3PeujhkDHtfD42bu2dJVXPQUoj6eCnw=',
            ios: 'sRwAAAEVY29tLm1pY3JvYmxpbmsuc2FtcGxl1BIcP6dpSuS/37rVPcGKMeTrsgR8MahcSwwXAx7W+q4DISNxpyD6+I7UJwEXZY0idcmSKWVeQM6vHpTFfH7GFprdWTFfjlKyu60UtOHF0npdL2MmfTLta+7nnJRT28SshWOzbKsFOlZ0JJoeiZMEyM4znE2J6KFWNTsI8rIUfKoZvf1ZrPQRT1B+2AzIVrm6WmIIUKHsoHnmvNM424vPEBC4yhcWu2anECMkX8Li/Q=='
        };

        function buildResult(result, key) {
            if (result && result != -1) {
                return key + ": " + result + "<br>";
            }
            return ""
        }

        function buildDateResult(result, key) {
            if (result) {
                return key + ": " +
                    result.day + "." + result.month + "." + result.year + "."
                    + "<br>";
            }
            return ""
        }

        scanButton.addEventListener('click', function() {
            cordova.plugins.BlinkCard.scanWithCamera(

                // Register the callback handler
                function callback(cancelled) {

                    resultDiv.innerHTML = "";

                    documentFirstImageDiv.style.visibility = "hidden";
                    documentSecondImageDiv.style.visibility = "hidden";

                    // handle cancelled scanning
                    if (cancelled) {
                        resultDiv.innerHTML = "Cancelled!";
                        return;
                    }

                    // if not cancelled, every recognizer will have its result property updated

                    if (blinkCardRecognizer.result.resultState == cordova.plugins.BlinkCard.RecognizerResultState.valid) {

                        var blinkCardResult = blinkCardRecognizer.result;
                        var resultString =
                            buildResult(blinkCardResult.cardNumber, 'Card Number') +
                            buildResult(blinkCardResult.cardNumberPrefix, 'Card Number Prefix') +
                            buildResult(blinkCardResult.iban, 'IBAN') +
                            buildResult(blinkCardResult.cvv, 'CVV') +
                            buildResult(blinkCardResult.owner, 'Owner') +
                            buildResult(blinkCardResult.cardNumberValid.toString(), 'Card Number Valid') +
                            buildDateResult(blinkCardResult.expiryDate, 'Expiry date');

                        // there are other fields to extract - check blinkCardScanner.js for full reference
                        resultDiv.innerHTML = resultString;

                        var resultDocumentFirstImage = blinkCardRecognizer.result.firstSideFullDocumentImage;
                        if (resultDocumentFirstImage) {
                            documentFirstImage.src = "data:image/jpg;base64, " + resultDocumentFirstImage;
                            documentFirstImageDiv.style.visibility = "visible";
                        }
                        var resultDocumentSecongImage = blinkCardRecognizer.result.secondSideFullDocumentImage;
                        if (resultDocumentSecongImage) {
                            documentSecondImage.src = "data:image/jpg;base64, " + resultDocumentSecongImage;
                            documentSecondImageDiv.style.visibility = "visible";
                        }
                    } else {
                        resultDiv.innerHTML = "Result is empty!";
                    }
                },

                // Register the error callback
                function errorHandler(err) {
                    alert('Error: ' + err);
                },

                blinkcardOverlaySettings, recognizerCollection, licenseKeys
            );
        });

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }

};
