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

        var blinkcardOverlaySettings = new cordova.plugins.BlinkCard.BlinkCardOverlaySettings();

        // create RecognizerCollection from any number of recognizers that should perform recognition
        var recognizerCollection = new cordova.plugins.BlinkCard.RecognizerCollection([blinkCardRecognizer]);

        // package name/bundleID com.microblink.sample
        var licenseKeys = {
            android: 'sRwCABVjb20ubWljcm9ibGluay5zYW1wbGUAbGV5SkRjbVZoZEdWa1QyNGlPakUzTVRJMU5qTTFOVEEzTlRJc0lrTnlaV0YwWldSR2IzSWlPaUprWkdRd05qWmxaaTAxT0RJekxUUXdNRGd0T1RRNE1DMDFORFU0WWpBeFlUVTJZamdpZlE9Pd63oOMBm0mx/s+0dSOmd4EjsCAoD20P5kOz3xHBmd7BA5bmfN0Ij+Z2ou413GAVLEXtho9QFh9a6VmW32NKZRv+lMG5XGSnij6oVB5I1x3IWED8kluJsVZxFnm9I1U=',
            ios: 'sRwCABVjb20ubWljcm9ibGluay5zYW1wbGUBbGV5SkRjbVZoZEdWa1QyNGlPakUzTVRJMU5qTTFNamMyT1RJc0lrTnlaV0YwWldSR2IzSWlPaUprWkdRd05qWmxaaTAxT0RJekxUUXdNRGd0T1RRNE1DMDFORFU0WWpBeFlUVTJZamdpZlE9PT1biknodonmIfXGRoRgDcJJ6XiWcxCFSE8flLOXwEKYwSUjWVAHSwI7GtA+oqJke90M+2giHY4Qqpeh67vsyoYHEyqCI8E6G47yBZxcIN/A7CFQq4IvMF4U7xaE1S4='
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

        function buildLivenessResult(result, key) {
            if (result && result !== -1) {
                return key + ": " + "<br>" +
                    buildResult(result.handPresenceCheck, 'Hand presence check') +
                    buildResult(result.photocopyCheck, 'Photocopy check') +
                    buildResult(result.screenCheck, 'Screen check');
            }
             return "";
        }

        function handleRecognizerResult(blinkCardResult) {
            var resultString =
            buildResult(blinkCardResult.cardNumber, 'Card Number') +
            buildResult(blinkCardResult.cardNumberPrefix, 'Card Number Prefix') +
            buildResult(blinkCardResult.iban, 'IBAN') +
            buildResult(blinkCardResult.cvv, 'CVV') +
            buildResult(blinkCardResult.owner, 'Owner') +
            buildResult(blinkCardResult.cardNumberValid.toString(), 'Card Number Valid') +
            buildDateResult(blinkCardResult.expiryDate, 'Expiry date') +
            buildResult(blinkCardResult.issuer, 'Issuer') +
            buildLivenessResult(blinkCardResult.documentLivenessCheck.front, 'Front side liveness checks') +
            buildLivenessResult(blinkCardResult.documentLivenessCheck.back, 'Back side liveness checks');

            // there are other fields to extract - check blinkCardScanner.js for full reference
            resultDiv.innerHTML = resultString;

            var resultDocumentFirstImage = blinkCardResult.firstSideFullDocumentImage;
            if (resultDocumentFirstImage) {
                documentFirstImage.src = "data:image/jpg;base64, " + resultDocumentFirstImage;
                documentFirstImageDiv.style.visibility = "visible";
            } else {
                documentFirstImage.src = "";
                documentFirstImageDiv.style.visibility = "hidden";
            }
            var resultDocumentSecondImage = blinkCardResult.secondSideFullDocumentImage;
            if (resultDocumentSecondImage) {
                documentSecondImage.src = "data:image/jpg;base64, " + resultDocumentSecondImage;
                documentSecondImageDiv.style.visibility = "visible";
            } else {
                documentSecondImage.src = "";
                documentSecondImageDiv.style.visibility = "hidden";

            }
        }

        //methods for opening the image picker and handling the data for the DirectAPI method of scanning
        function openImagePicker(callback) {
            return new Promise(function(resolve, reject) {
                var options = {
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                    mediaType: Camera.MediaType.PICTURE
                    };
                
                navigator.camera.getPicture(function(imageData) {
                    callback(imageData);
                    resolve();
                    }, function(errorMessage) {
                        reject(errorMessage);
                    }, options);
            });
        }
        
        function handleFirstSideImage(imageData) {
            firstSideImage = imageData;
        }
        
        function handleSecondSideImage(imageData) {
            secondSideImage = imageData;
        }

        /* BlinkCard scanning with camera */
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
                        handleRecognizerResult(blinkCardRecognizer.result)
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

        /* BlinkCard scanning with DirectAPI that requires both card images.
        Best used for getting the information from both front and backside information from various cards */
        directApiTwoSidesButton.addEventListener('click', function() {
            //Open the image picker for getting the card image with the card number
            openImagePicker(handleFirstSideImage)
                .then(function() {
                //Open the image picker again for getting the second side of the card
                return openImagePicker(handleSecondSideImage);
                })
                .then(function() {
                    //Send the images to the scanWithDirectApi method for processing
                    cordova.plugins.BlinkCard.scanWithDirectApi(

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

                            if (blinkCardRecognizer.result.resultState != cordova.plugins.BlinkCard.RecognizerResultState.empty) {
                                handleRecognizerResult(blinkCardRecognizer.result)
                            } else {
                                resultDiv.innerHTML = "Result is empty!";
                            }
                        },
                        // Register the error callback
                        function errorHandler(err) {
                            alert('Error: ' + err);
                        },
                        recognizerCollection, firstSideImage, secondSideImage, licenseKeys
                    );
                })
                //Catch any errors that might occur during the DirectAPI processing
                .catch(function(error) {
                    alert('DirectAPI TwoSides error: ' + error);
                });
        });

        /* BlinkCard scanning with DirectAPI that requires one card image.
        Best used for cards that have all of the information on one side, or if the needed information is on one side */
        directApiOneSideButton.addEventListener('click', function() {
            //Open the image picker for getting the card image with the card number
            openImagePicker(handleFirstSideImage)
                .then(function() {

                    // BlinkCardRecognizer automatically classifies different credit card types and scans the data from
                    // the supported credit card
                    var blinkCardRecognizer = new cordova.plugins.BlinkCard.BlinkCardRecognizer();
                    blinkCardRecognizer.returnFullDocumentImage = true;
                    blinkCardRecognizer.extractCvv = false;
                    blinkCardRecognizer.extractIban = false;
                    blinkCardRecognizer.extractExpiryDate = false;
        
                    // create RecognizerCollection from any number of recognizers that should perform recognition
                    var recognizerCollection = new cordova.plugins.BlinkCard.RecognizerCollection([blinkCardRecognizer]);
                    
                    //Send the image to the scanWithDirectApi method for processing
                    cordova.plugins.BlinkCard.scanWithDirectApi(

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

                            if (blinkCardRecognizer.result.resultState != cordova.plugins.BlinkCard.RecognizerResultState.empty) {
                                handleRecognizerResult(blinkCardRecognizer.result)
                            } else {
                                resultDiv.innerHTML = "Result is empty!";
                            }
                        },
                        // Register the error callback
                        function errorHandler(err) {
                            alert('Error: ' + err);
                        },
                        recognizerCollection, firstSideImage, null, licenseKeys
                    );
                })
                //Catch any errors that might occur during the DirectAPI processing
                .catch(function(error) {
                    alert('DirectAPI OneSide error: ' + error);
                });
        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};