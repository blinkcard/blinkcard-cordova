/**
 * cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Matt Kane 2010
 * Copyright (c) 2011, IBM Corporation
 */


var exec = require("cordova/exec");

/**
 * Constructor.
 *
 * @returns {BlinkCard}
 */
function BlinkCard() {

};

/**
 * successCallback: callback that will be invoked on successful scan
 * errorCallback: callback that will be invoked on error
 * overlaySettings: settings for desired camera overlay
 * recognizerCollection: {RecognizerCollection} containing recognizers to use for scanning
 * licenses: object containing:
 *               - base64 license keys for iOS and Android
 *               - optioanl parameter 'licensee' when license for multiple apps is used
 *               - optional flag 'showTrialLicenseKeyWarning' which indicates
 *                  whether warning for trial license key will be shown, in format
 *  {
 *      ios: 'base64iOSLicense',
 *      android: 'base64AndroidLicense',
 *      licensee: String,
 *      showTrialLicenseKeyWarning: Boolean
 *  }
 */
BlinkCard.prototype.scanWithCamera = function (successCallback, errorCallback, overlaySettings, recognizerCollection, licenses) {
    if (errorCallback == null) {
        errorCallback = function () {
        };
    }

    if (typeof errorCallback != "function") {
        console.log("BlinkCardScanner.scanWithCamera failure: failure parameter not a function");
        throw new Error("BlinkCardScanner.scanWithCamera failure: failure parameter not a function");
        return;
    }

    if (typeof successCallback != "function") {
        console.log("BlinkCardScanner.scanWithCamera failure: success callback parameter must be a function");
        throw new Error("BlinkCardScanner.scanWithCamera failure: success callback parameter must be a function");
        return;
    }

    // first invalidate old results
    for (var i = 0; i < recognizerCollection.recognizerArray[i].length; ++i ) {
        recognizerCollection.recognizerArray[i].result = null;
    }

    exec(
        function internalCallback(scanningResult) {
            var cancelled = scanningResult.cancelled;

            if (cancelled) {
                successCallback(true);
            } else {
                var results = scanningResult.resultList;
                if (results.length != recognizerCollection.recognizerArray.length) {
                    console.log("INTERNAL ERROR: native plugin returned wrong number of results!");
                    throw new Error("INTERNAL ERROR: native plugin returned wrong number of results!");
                    errorCallback(new Error("INTERNAL ERROR: native plugin returned wrong number of results!"));
                } else {
                    for (var i = 0; i < results.length; ++i) {
                        // native plugin must ensure types match
                        recognizerCollection.recognizerArray[i].result = recognizerCollection.recognizerArray[i].createResultFromNative(results[i]);
                    }
                    successCallback(false);
                }
            }
        },
        errorCallback, 'BlinkCardScanner', 'scanWithCamera', [overlaySettings, recognizerCollection, licenses]);
};

/**
 * successCallback: callback that will be invoked on successful scan
 * errorCallback: callback that will be invoked on error
 * recognizerCollection: {RecognizerCollection} containing recognizers to use for scanning
 * frontImage: the Base64 format string that represents the image of the card where the card number is located that will be used for processing with DirectAPI
 * backImage: the Base64 format string that represents the second side of the card that will be used for processing with DirectAPI
 *      - This parameter is optional for cards that have all of the information located on one side, or if the BlinkCardRecognizer information extraction 
 *        settings, that are enabled, are located only on one side of the card
 *      - Pass 'null' or an empty string "" for this parameter in this case
 * licenses: object containing:
 *               - base64 license keys for iOS and Android
 *               - optioanl parameter 'licensee' when license for multiple apps is used
 *               - optional flag 'showTrialLicenseKeyWarning' which indicates
 *                  whether warning for trial license key will be shown, in format
 *  {
 *      ios: 'base64iOSLicense',
 *      android: 'base64AndroidLicense',
 *      licensee: String,
 *      showTrialLicenseKeyWarning: Boolean
 *  }
 */

BlinkCard.prototype.scanWithDirectApi = function (successCallback, errorCallback, recognizerCollection, frontImage, backImage, licenses) {
    if (errorCallback == null) {
        errorCallback = function () {
        };
    }

    if (typeof errorCallback != "function") {
        console.log("BlinkIDScanner.scanWithDirectApi failure: failure parameter not a function");
        throw new Error("BlinkIDScanner.scanWithDirectApi failure: failure parameter not a function");
        return;
    }

    if (typeof successCallback != "function") {
        console.log("BlinkIDScanner.scanWithDirectApi failure: success callback parameter must be a function");
        throw new Error("BlinkIDScanner.scanWithDirectApi failure: success callback parameter must be a function");
        return;
    }

    // first invalidate old results
    for (var i = 0; i < recognizerCollection.recognizerArray[i].length; ++i ) {
        recognizerCollection.recognizerArray[i].result = null;
    }

    exec(
        function internalCallback(scanningResult) {
            var cancelled = scanningResult.cancelled;

            if (cancelled) {
                successCallback(true);
            } else {
                var results = scanningResult.resultList;
                if (results.length != recognizerCollection.recognizerArray.length) {
                    console.log("INTERNAL ERROR: native plugin returned wrong number of results!");
                    throw new Error("INTERNAL ERROR: native plugin returned wrong number of results!");
                    errorCallback(new Error("INTERNAL ERROR: native plugin returned wrong number of results!"));
                } else {
                    for (var i = 0; i < results.length; ++i) {
                        // native plugin must ensure types match
                        recognizerCollection.recognizerArray[i].result = recognizerCollection.recognizerArray[i].createResultFromNative(results[i]);
                    }
                    successCallback(false);
                }
            }
        },
        errorCallback, 'BlinkCardScanner', 'scanWithDirectApi', [recognizerCollection, frontImage, backImage, licenses]);
};

// COMMON CLASSES

/**
 * Base class for all recognizers.
 * Recognizer is object that performs recognition of image
 * and updates its result with data extracted from the image.
 */
function Recognizer(recognizerType) {
    /** Type of recognizer */
    this.recognizerType = recognizerType;
    /** Recognizer's result */
    this.result = null;
}

/**
 * Possible states of the Recognizer's result
 */
var RecognizerResultState = Object.freeze(
    {
        /** Recognizer result is empty */
        empty : 0,
        /** Recognizer result contains some values, but is incomplete or it contains all values, but some are not uncertain */
        uncertain : 1,
        /** Recognizer resul contains all required values */
        valid : 2
    }
);

/**
 * Possible states of the Recognizer's result
 */
BlinkCard.prototype.RecognizerResultState = RecognizerResultState;

/**
 * Base class for all recognizer's result objects.
 * Recoginzer result contains data extracted from the image.
 */
function RecognizerResult(resultState) {
    /** State of the result. It is always one of the values represented by BlinkCardScanner.RecognizerResultState enum */
    this.resultState = resultState;
}

/**
 * Represents a collection of recognizer objects.
 * @param recognizerArray Array of recognizer objects that will be used for recognition. Must not be empty!
 */
function RecognizerCollection(recognizerArray) {
    /** Array of recognizer objects that will be used for recognition */
    this.recognizerArray = recognizerArray;
    /**
     * Whether or not it is allowed for multiple recognizers to process the same image.
     * If not, then first recognizer that will be successful in processing the image will
     * end the processing chain and other recognizers will not get the chance to process
     * that image.
     */
    this.allowMultipleResults = false;
    /** Number of miliseconds after first non-empty result becomes available to end scanning with a timeout */
    this.milisecondsBeforeTimeout = 0;

    if (!(this.recognizerArray.constructor === Array)) {
        throw new Error("recognizerArray must be array of Recognizer objects!");
    }
    // ensure every element in array is Recognizer
    for (var i = 0; i < this.recognizerArray.length; ++i) {
        if (!(this.recognizerArray[i] instanceof Recognizer )) {
            throw new Error( "Each element in recognizerArray must be instance of Recognizer" );
        }
    }
}

BlinkCard.prototype.RecognizerCollection = RecognizerCollection;

/**
 * Represents a date extracted from image.
 */
function Date(nativeDate) {
    /** day in month */
    this.day = nativeDate.day;
    /** month in year */
    this.month = nativeDate.month;
    /** year */
    this.year = nativeDate.year;
    /** original date string */
    this.originalDateStringResult = nativeDate.originalDateStringResult;
    /** isFilledByDomainKnowledge */
    this.isFilledByDomainKnowledge = nativeDate.isFilledByDomainKnowledge;
}

BlinkCard.prototype.Date = Date;

/**
 * Represents a point in image
 */
function Point(nativePoint) {
    /** x coordinate of the point */
    this.x = nativePoint.x;
    /** y coordinate of the point */
    this.y = nativePoint.y;
}

BlinkCard.prototype.Point = Point;

/**
 * Represents a quadrilateral location in the image
 */
function Quadrilateral(nativeQuad) {
    /** upper left point of the quadrilateral */
    this.upperLeft = new Point(nativeQuad.upperLeft);
    /** upper right point of the quadrilateral */
    this.upperRight = new Point(nativeQuad.upperRight);
    /** lower left point of the quadrilateral */
    this.lowerLeft = new Point(nativeQuad.lowerLeft);
    /** lower right point of the quadrilateral */
    this.lowerRight = new Point(nativeQuad.lowerRight);
}

BlinkCard.prototype.Quadrilateral = Quadrilateral;
/**
 * Result of the data matching algorithm for scanned parts/sides of the document.
 */
var DataMatchState = Object.freeze(
    {
        /** Data matching has not been performed. */
        NotPerformed : 0,
        /** Data does not match. */
        Failed : 1,
        /** Data match. */
        Success : 2
    }
);

/**
 * Possible values for Document Data Match State field.
 */
BlinkCard.prototype.DataMatchState = DataMatchState

/**
 * Extension factors relative to corresponding dimension of the full image. For example,
 * upFactor and downFactor define extensions relative to image height, e.g.
 * when upFactor is 0.5, upper image boundary will be extended for half of image's full
 * height.
 */
function ImageExtensionFactors() {
    /** image extension factor relative to full image height in UP direction. */
    this.upFactor = 0.0;
    /** image extension factor relative to full image height in RIGHT direction. */
    this.rightFactor = 0.0;
    /** image extension factor relative to full image height in DOWN direction. */
    this.downFactor = 0.0;
    /** image extension factor relative to full image height in LEFT direction. */
    this.leftFactor = 0.0;
}

BlinkCard.prototype.ImageExtensionFactors = ImageExtensionFactors;
/**
 * Supported BlinkCard card issuer values.
 */
var Issuer = Object.freeze(
    {
        /* Unidentified Card */
        Other: 0,
        /* The American Express Company Card */
        AmericanExpress: 1,
        /* China UnionPay Card */
        ChinaUnionPay: 2,
        /* Diners Club International Card */
        Diners: 3,
        /* Discover Card */
        DiscoverCard: 4,
        /* Elo card association */
        Elo: 5,
        /* The JCB Company Card */
        Jcb: 6,
        /* Maestro Debit Card */
        Maestro: 7,
        /* Mastercard Inc. Card */
        Mastercard: 8,
        /* RuPay */
        RuPay: 9,
        /* Interswitch Verve Card */
        Verve: 10,
        /* Visa Inc. Card */
        Visa: 11,
        /* VPay */
        VPay: 12
    }
);

BlinkCard.prototype.Issuer = Issuer;

/**
 * Supported BLinkCard processing status
 */
var BlinkCardProcessingStatus = Object.freeze(
    {
        /** Recognition was successful. */
        Success: 0,
        /** Detection of the document failed. */
        DetectionFailed: 1,
        /** Preprocessing of the input image has failed. */
        ImagePreprocessingFailed: 2,
        /** Recognizer has inconsistent results. */
        StabilityTestFailed: 3,
        /** Wrong side of the document has been scanned. */
        ScanningWrongSide: 4,
        /** Identification of the fields present on the document has failed. */
        FieldIdentificationFailed: 5,
        /** Failed to return a requested image. */
        ImageReturnFailed: 6,
        /** Payment card currently not supported by the recognizer. */
        UnsupportedCard: 7
    }
);

BlinkCard.prototype.BlinkCardProcessingStatus = BlinkCardProcessingStatus;

/**
 * Determines which data is anonymized in the returned recognizer result.
 */
var BlinkCardAnonymizationMode = Object.freeze(
    {
        /** No anonymization is performed in this mode. */
        None: 0,

        /** Sensitive data in the document image is anonymized with black boxes covering selected sensitive data. Data returned in result fields is not changed. */
        ImageOnly: 1,

        /** Document image is not changed. Data returned in result fields is redacted. */
        ResultFieldsOnly: 2,

        /** Sensitive data in the image is anonymized with black boxes covering selected sensitive data. Data returned in result fields is redacted. */
        FullResult: 3
    }
);

/**
 * Define level of anonymization performed on recognizer result.
 */
BlinkCard.prototype.BlinkCardAnonymizationMode = BlinkCardAnonymizationMode;

/**
 *Enumerates the possible match levels indicating the strictness of a check result. Higher is stricter.
 */
var BlinkCardMatchLevel = Object.freeze(
    {
        /** Match level is disabled */
        Disabled: 0,

        /** Match level one. */
        Level1: 1,

        /** Match level two */
        Level2: 2,

        /** Match level three */        
        Level3: 3,

        /** Match level four */
        Level4: 4,

        /** Match level five */
        Level5: 5,

        /** Match level six */
        Level6: 6,

        /** Match level seven */
        Level7: 7,

        /** Match level eight */
        Level8: 8,

        /** Match level nine */
        Level9: 9,

        /** Match level ten. Most strict match level */
        Level10: 10
    }
);

BlinkCard.prototype.BlinkCardMatchLevel = BlinkCardMatchLevel;

/**
 * Enumerates the possible results of BlinkCard's document liveness checks.
 */
var BlinkCardCheckResult = Object.freeze(
    {
        /** Indicates that the check was not performed. */
        NotPerformed: 0,

        /** Indicates that the document passed the check successfully. */
        Pass: 1,

        /** Indicates that the document failed the check. */
        Fail: 2,
    }
);

BlinkCard.prototype.BlinkCardCheckResult = BlinkCardCheckResult;

/**
 * Holds the settings which control card number anonymization.
 */
function CardNumberAnonymizationSettings() {
    /** Defines the mode of card number anonymization. */
    this.mode = BlinkCardAnonymizationMode.None;
    /** Defines how many digits at the beginning of the card number remain visible after anonymization. */
    this.prefixDigitsVisible = 0;
    /** Defines how many digits at the end of the card number remain visible after anonymization. */
    this.suffixDigitsVisible = 0;
}

BlinkCard.prototype.CardNumberAnonymizationSettings = CardNumberAnonymizationSettings;

/**
 * Holds the settings which control card anonymization.
 */
function BlinkCardAnonymizationSettings() {
    /** Defines the parameters of card number anonymization. */
    this.cardNumberAnonymizationSettings = new CardNumberAnonymizationSettings();
    /** Defines the mode of card number prefix anonymization. */
    this.cardNumberPrefixAnonymizationMode = BlinkCardAnonymizationMode.None;
    /** Defines the mode of CVV anonymization. */
    this.cvvAnonymizationMode = BlinkCardAnonymizationMode.None;
    /** Defines the mode of IBAN anonymization. */
    this.ibanAnonymizationMode = BlinkCardAnonymizationMode.None;
    /** Defines the mode of owner anonymization. */
    this.ownerAnonymizationMode = BlinkCardAnonymizationMode.None;
}

BlinkCard.prototype.BlinkCardAnonymizationSettings = BlinkCardAnonymizationSettings;

// COMMON CLASSES

// OVERLAY SETTINGS

/** Base class for all overlay settings objects */
function OverlaySettings(overlaySettingsType) {
    /** type of the overlay settings object */
    this.overlaySettingsType = overlaySettingsType;

    /**
     * Whether beep sound will be played on successful scan.
     */
    this.enableBeep = false;
    /**
     * Whether front camera should be used instead of the default camera.
     */
    this.useFrontCamera = false;
}
/**
 * Class for setting up BlinkCard overlay.
 * BlinkCard overlay is best suited for scanning payment cards.
 */
function BlinkCardOverlaySettings() {
    OverlaySettings.call(this, 'BlinkCardOverlaySettings');
    /**
    * String: user instructions that are shown above camera preview while the first side of the
    * document is being scanned.
    * If null, default value will be used.
    */
    this.firstSideInstructions = null;
    /**
    * String: user instructions that are shown above camera preview while the second side of the
    * document is being scanned.
    * If null, default value will be used.
    */
    this.flipCardInstructions = null;

    /**
     * Defines whether glare warning will be displayed when user turn on a flashlight
     *
     * Default: true
    */
    this.showFlashlightWarning = true;

    /**
    * String: Instructions for the user to move the document closer
    * 
    * If null, default value will be used.
    */
    this.errorMoveCloser = null;

    /**
    * String: Instructions for the user to move the document farther
    * 
    * If null, default value will be used.
    */
    this.errorMoveFarther = null;

    /**
    * String: Instructions for the user to move the document from the edge
    * 
    * If null, default value will be used.
    */
    this.errorCardTooCloseToEdge = null;

    /**
    * Defines whether button for presenting onboarding screens will be present on screen
    * 
    * Default: true
    */
    this.showOnboardingInfo = true;

    /**
    * Defines whether button for presenting onboarding screens will be present on screen
    * 
    * Default: true
    */
    this.showIntroductionDialog = true;

    /**
    * Option to configure when the onboarding help tooltip will appear. 
    * 
    * Default: 8000
    */
    this.onboardingButtonTooltipDelay = 8000;
    
    /**
    * Language of the UI. 
    * If default overlay contains textual information, text will be localized to this language. Otherwise device langauge will be used
    * example: "en" 
    */
    this.language = null;

    /**
    * Used with language variable, it defines the country locale 
    *
    * example: "US" to use "en_US" on Android and en-US on iOS
    */
    this.country = null;
}

BlinkCardOverlaySettings.prototype = new OverlaySettings();

BlinkCard.prototype.BlinkCardOverlaySettings = BlinkCardOverlaySettings;


// OVERLAY SETTINGS

// RECOGNIZERS
/**
 * Result object for SuccessFrameGrabberRecognizer.
 */
function SuccessFrameGrabberRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    /** Camera frame at the time slave recognizer finished recognition */
    this.successFrame = nativeResult.successFrame;
}

SuccessFrameGrabberRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkCard.prototype.SuccessFrameGrabberRecognizerResult = SuccessFrameGrabberRecognizerResult;

/**
 * SuccessFrameGrabberRecognizer can wrap any other recognizer and obtain camera
 * frame on which the other recognizer finished recognition.
 */
function SuccessFrameGrabberRecognizer(slaveRecognizer) {
    Recognizer.call(this, 'SuccessFrameGrabberRecognizer');
    /** Slave recognizer that SuccessFrameGrabberRecognizer will watch */
    this.slaveRecognizer = slaveRecognizer;

    if (!this.slaveRecognizer instanceof Recognizer) {
        throw new Error("Slave recognizer must be Recognizer!");
    }

    this.createResultFromNative = (function (nativeResult) {
        this.slaveRecognizer.result = this.slaveRecognizer.createResultFromNative(nativeResult.slaveRecognizerResult);
        return new SuccessFrameGrabberRecognizerResult(nativeResult)
    }).bind(this);
}

SuccessFrameGrabberRecognizer.prototype = new Recognizer('SuccessFrameGrabberRecognizer');

BlinkCard.prototype.SuccessFrameGrabberRecognizer = SuccessFrameGrabberRecognizer;


/**
 * Result object for BlinkCardRecognizer.
 */
function BlinkCardRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /**
     * The payment card number.
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /**
     * The payment card number prefix.
     */
    this.cardNumberPrefix = nativeResult.cardNumberPrefix;
    
    /**
     * The payment card number is valid
     */
    this.cardNumberValid = nativeResult.cardNumberValid;
    
    /**
     *  Payment card's security code/value.
     */
    this.cvv = nativeResult.cvv;
    
    /**
     * Document liveness check (screen, photocopy, hand presence) which can pass or fail.
     */
    this.documentLivenessCheck = nativeResult.documentLivenessCheck;
    
    /**
     * The payment card's expiry date.
     */
    this.expiryDate = nativeResult.expiryDate != null ? new Date(nativeResult.expiryDate) : null;
    
    /**
     * Whether the first scanned side is anonymized.
     */
    this.firstSideAnonymized = nativeResult.firstSideAnonymized;
    
    /**
     * Whether the first scanned side is blurred.
     */
    this.firstSideBlurred = nativeResult.firstSideBlurred;
    
    /**
     * Full image of the payment card from first side recognition.
     */
    this.firstSideFullDocumentImage = nativeResult.firstSideFullDocumentImage;
    
    /**
     * Payment card's IBAN.
     */
    this.iban = nativeResult.iban;
    
    /**
     * Payment card's issuing network.
     */
    this.issuer = nativeResult.issuer;
    
    /**
     * Information about the payment card owner (name, company, etc.).
     */
    this.owner = nativeResult.owner;
    
    /**
     * Status of the last recognition process.
     */
    this.processingStatus = nativeResult.processingStatus;
    
    /**
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side.
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /**
     * Whether the second scanned side is anonymized.
     */
    this.secondSideAnonymized = nativeResult.secondSideAnonymized;
    
    /**
     * Whether the second scanned side is blurred.
     */
    this.secondSideBlurred = nativeResult.secondSideBlurred;
    
    /**
     * Full image of the payment card from second side recognition.
     */
    this.secondSideFullDocumentImage = nativeResult.secondSideFullDocumentImage;
    
}

BlinkCardRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkCard.prototype.BlinkCardRecognizerResult = BlinkCardRecognizerResult;

/**
 * Recognizer used for scanning credit/debit cards.
 */
function BlinkCardRecognizer() {
    Recognizer.call(this, 'BlinkCardRecognizer');
    
    /**
     * Defines whether blured frames filtering is allowed
     * 
     * 
     */
    this.allowBlurFilter = true;
    
    /**
     * Whether invalid card number is accepted.
     * 
     * 
     */
    this.allowInvalidCardNumber = false;
    
    /**
     * Defines whether sensitive data should be redacted from the result.
     * 
     * 
     */
    this.anonymizationSettings = new BlinkCardAnonymizationSettings();
    
    /**
     * Should extract CVV
     * 
     * 
     */
    this.extractCvv = true;
    
    /**
     * Should extract the payment card's month of expiry
     * 
     * 
     */
    this.extractExpiryDate = true;
    
    /**
     * Should extract the payment card's IBAN
     * 
     * 
     */
    this.extractIban = true;
    
    /**
     * Should extract the card owner information
     * 
     * 
     */
    this.extractOwner = true;
    
    /**
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     * 
     */
    this.fullDocumentImageDpi = 250;
    
    /**
     * Image extension factors for full document image.
     * 
     * @see CImageExtensionFactors
     * 
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /**
     * This parameter is used to adjust heuristics that eliminate cases when the hand is present.
     * 
     * 
     */
    this.handDocumentOverlapThreshold = 0.05;
    
    /**
     * Hand scale is calculated as a ratio between area of hand mask and document mask.
     * 
     * 
     */
    this.handScaleThreshold = 0.15;
    
    /**
     * Pading is a minimum distance from the edge of the frame and is defined as a percentage of the frame width. Default value is 0.0f and in that case
     * padding edge and image edge are the same.
     * Recommended value is 0.02f.
     * 
     * 
     */
    this.paddingEdge = 0.0;
    
    /**
     * Photocopy analysis match level - higher if stricter.
     * 
     * 
     */
    this.photocopyAnalysisMatchLevel = BlinkCardMatchLevel.Level5;
    
    /**
     * Sets whether full document image of ID card should be extracted.
     * 
     * 
     */
    this.returnFullDocumentImage = false;
    
    /**
     * Screen analysis match level - higher if stricter.
     * 
     * 
     */
    this.screenAnalysisMatchLevel = BlinkCardMatchLevel.Level5;
    
    this.createResultFromNative = function (nativeResult) { return new BlinkCardRecognizerResult(nativeResult); }

}

BlinkCardRecognizer.prototype = new Recognizer('BlinkCardRecognizer');

BlinkCard.prototype.BlinkCardRecognizer = BlinkCardRecognizer;

// RECOGNIZERS

// export BlinkCardScanner
module.exports = new BlinkCard();