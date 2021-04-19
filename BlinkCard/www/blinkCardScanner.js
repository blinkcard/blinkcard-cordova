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
        empty : 1,
        /** Recognizer result contains some values, but is incomplete or it contains all values, but some are not uncertain */
        uncertain : 2,
        /** Recognizer resul contains all required values */
        valid : 3
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
    this.milisecondsBeforeTimeout = 10000;

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
var DataMatchResult = Object.freeze(
    {
        /** Data matching has not been performed. */
        NotPerformed : 1,
        /** Data does not match. */
        Failed : 2,
        /** Data match. */
        Success : 3
    }
);

/**
 * Possible values for Document Data Match Result field.
 */
BlinkCard.prototype.DataMatchResult = DataMatchResult

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
var LegacyCardIssuer = Object.freeze(
    {
        /** Unidentified Card */
        Other: 1,
        /** The American Express Company Card */
        AmericanExpress: 2,
        /** The Bank of Montreal ABM Card */
        BmoAbm: 3,
        /** China T-Union Transportation Card */
        ChinaTUnion: 4,
        /** China UnionPay Card */
        ChinaUnionPay: 5,
        /** Canadian Imperial Bank of Commerce Advantage Debit Card */
        CibcAdvantageDebit: 6,
        /** CISS Card */
        Ciss: 7,
        /** Diners Club International Card */
        DinersClubInternational: 8,
        /** Diners Club United States & Canada Card */
        DinersClubUsCanada: 9,
        /** Discover Card */
        DiscoverCard: 10,
        /** HSBC Bank Canada Card */
        Hsbc: 11,
        /** RuPay Card */
        RuPay: 12,
        /** InterPayment Card */
        InterPayment: 13,
        /** InstaPayment Card */
        InstaPayment: 14,
        /** The JCB Company Card */
        Jcb: 15,
        /** Laser Debit Card (deprecated) */
        Laser: 16,
        /** Maestro Debit Card */
        Maestro: 17,
        /** Dankort Card */
        Dankort: 18,
        /** MIR Card */
        Mir: 19,
        /** MasterCard Inc. Card */
        MasterCard: 20,
        /** The Royal Bank of Canada Client Card */
        RbcClient: 21,
        /** ScotiaBank Scotia Card */
        ScotiaBank: 22,
        /** TD Canada Trust Access Card */
        TdCtAccess: 23,
        /** Troy Card */
        Troy: 24,
        /** Visa Inc. Card */
        Visa: 25,
        /** Universal Air Travel Plan Inc. Card */
        Uatp: 26,
        /** Interswitch Verve Card */
        Verve: 27
    }
);

BlinkCard.prototype.LegacyCardIssuer = LegacyCardIssuer;

/**
 * Supported BlinkCard card issuer values.
 */
var Issuer = Object.freeze(
    {
        /* Unidentified Card */
        Other: 1,
        /* The American Express Company Card */
        AmericanExpress: 2,
        /* China UnionPay Card */
        ChinaUnionPay: 3,
        /* Diners Club International Card */
        Diners: 4,
        /* Discover Card */
        DiscoverCard: 5,
        /* Elo card association */
        Elo: 6,
        /* The JCB Company Card */
        Jcb: 7,
        /* Maestro Debit Card */
        Maestro: 8,
        /* Mastercard Inc. Card */
        Mastercard: 9,
        /* RuPay */
        RuPay: 10,
        /* Interswitch Verve Card */
        Verve: 11,
        /* Visa Inc. Card */
        Visa: 12,
        /* VPay */
        VPay: 13
    }
);

BlinkCard.prototype.Issuer = Issuer;

/**
 * Supported BLinkCard processing status
 */
var BlinkCardProcessingStatus = Object.freeze(
    {
        /** Recognition was successful. */
        Success: 1,
        /** Detection of the document failed. */
        DetectionFailed: 2,
        /** Preprocessing of the input image has failed. */
        ImagePreprocessingFailed: 3,
        /** Recognizer has inconsistent results. */
        StabilityTestFailed: 4,
        /** Wrong side of the document has been scanned. */
        ScanningWrongSide: 5,
        /** Identification of the fields present on the document has failed. */
        FieldIdentificationFailed: 6,
        /** Failed to return a requested image. */
        ImageReturnFailed: 7,
        /** Payment card currently not supported by the recognizer. */
        UnsupportedCard: 8
    }
);

BlinkCard.prototype.BlinkCardProcessingStatus = BlinkCardProcessingStatus;

/**
 * Determines which data is anonymized in the returned recognizer result.
 */
var BlinkCardAnonymizationMode = Object.freeze(
    {
        /** No anonymization is performed in this mode. */
        None: 1,

        /** Sensitive data in the document image is anonymized with black boxes covering selected sensitive data. Data returned in result fields is not changed. */
        ImageOnly: 2,

        /** Document image is not changed. Data returned in result fields is redacted. */
        ResultFieldsOnly: 3,

        /** Sensitive data in the image is anonymized with black boxes covering selected sensitive data. Data returned in result fields is redacted. */
        FullResult: 4
    }
);

/**
 * Define level of anonymization performed on recognizer result.
 */
BlinkCard.prototype.BlinkCardAnonymizationMode = BlinkCardAnonymizationMode;

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
         * Digital signature of the recognition result. Available only if enabled with signResult property.
         */
        this.digitalSignature = nativeResult.digitalSignature;

        /**
         * Version of the digital signature. Available only if enabled with signResult property.
         */
        this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;

        /**
         * The payment card's expiry date.
         */
        this.expiryDate = nativeResult.expiryDate != null ? new Date(nativeResult.expiryDate) : null;

        /**
         * Wheater the first scanned side is blurred.
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
         * Wheater the second scanned side is blurred.
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
         * Pading is a minimum distance from the edge of the frame and is defined as a percentage of the frame width. Default value is 0.0f and in that case
         * padding edge and image edge are the same.
         * Recommended value is 0.02f.
         *
         *
         */
        this.paddingEdge = 0.0;

        /**
         * Sets whether full document image of ID card should be extracted.
         *
         *
         */
        this.returnFullDocumentImage = false;

        /**
         * Whether or not recognition result should be signed.
         *
         *
         */
        this.signResult = false;

        this.createResultFromNative = function (nativeResult) { return new BlinkCardRecognizerResult(nativeResult); }
    }


BlinkCardRecognizer.prototype = new Recognizer('BlinkCardRecognizer');

BlinkCard.prototype.BlinkCardRecognizer = BlinkCardRecognizer;

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
 * Result object for LegacyBlinkCardEliteRecognizer.
 */
function LegacyBlinkCardEliteRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /**
     * The payment card number.
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /**
     *  Payment card's security code/value
     */
    this.cvv = nativeResult.cvv;
    
    /**
     * Digital signature of the recognition result. Available only if enabled with signResult property.
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /**
     * Version of the digital signature. Available only if enabled with signResult property.
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /**
     * Returns CDataMatchResultSuccess if data from scanned parts/sides of the document match,
     * CDataMatchResultFailed otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return CDataMatchResultFailed. Result will
     * be CDataMatchResultSuccess only if scanned values for all fields that are compared are the same.
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /**
     * back side image of the document if enabled with returnFullDocumentImage property.
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /**
     * front side image of the document if enabled with returnFullDocumentImage property.
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /**
     * Payment card's inventory number.
     */
    this.inventoryNumber = nativeResult.inventoryNumber;
    
    /**
     * Information about the payment card owner (name, company, etc.).
     */
    this.owner = nativeResult.owner;
    
    /**
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side.
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /**
     * The payment card's last month of validity.
     */
    this.validThru = nativeResult.validThru != null ? new Date(nativeResult.validThru) : null;
    
}

LegacyBlinkCardEliteRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkCard.prototype.LegacyBlinkCardEliteRecognizerResult = LegacyBlinkCardEliteRecognizerResult;

/**
 * Recognizer used for scanning the front side of elite credit/debit cards.
 */
function LegacyBlinkCardEliteRecognizer() {
    Recognizer.call(this, 'LegacyBlinkCardEliteRecognizer');
    
    /**
     * Should anonymize the card number area (redact image pixels) on the document image result
     * 
     * 
     */
    this.anonymizeCardNumber = false;
    
    /**
     * Should anonymize the CVV on the document image result
     * 
     * 
     */
    this.anonymizeCvv = false;
    
    /**
     * Should anonymize the owner area (redact image pixels) on the document image result
     * 
     * 
     */
    this.anonymizeOwner = false;
    
    /**
     * Defines if glare detection should be turned on/off.
     * 
     * 
     */
    this.detectGlare = true;
    
    /**
     * Should extract the card's inventory number
     * 
     * 
     */
    this.extractInventoryNumber = true;
    
    /**
     * Should extract the card owner information
     * 
     * 
     */
    this.extractOwner = true;
    
    /**
     * Should extract the payment card's month of expiry
     * 
     * 
     */
    this.extractValidThru = true;
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     * 
     */
    this.returnFullDocumentImage = false;
    
    /**
     * Whether or not recognition result should be signed.
     * 
     * 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new LegacyBlinkCardEliteRecognizerResult(nativeResult); }

}

LegacyBlinkCardEliteRecognizer.prototype = new Recognizer('LegacyBlinkCardEliteRecognizer');

BlinkCard.prototype.LegacyBlinkCardEliteRecognizer = LegacyBlinkCardEliteRecognizer;

/**
 * Result object for LegacyBlinkCardRecognizer.
 */
function LegacyBlinkCardRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /**
     * The payment card number.
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /**
     *  Payment card's security code/value
     */
    this.cvv = nativeResult.cvv;
    
    /**
     * Digital signature of the recognition result. Available only if enabled with signResult property.
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /**
     * Version of the digital signature. Available only if enabled with signResult property.
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /**
     * Returns CDataMatchResultSuccess if data from scanned parts/sides of the document match,
     * CDataMatchResultFailed otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return CDataMatchResultFailed. Result will
     * be CDataMatchResultSuccess only if scanned values for all fields that are compared are the same.
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /**
     * back side image of the document if enabled with returnFullDocumentImage property.
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /**
     * front side image of the document if enabled with returnFullDocumentImage property.
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /**
     * Payment card's IBAN
     */
    this.iban = nativeResult.iban;
    
    /**
     * Payment card's inventory number.
     */
    this.inventoryNumber = nativeResult.inventoryNumber;
    
    /**
     * Payment card's issuing network
     */
    this.issuer = nativeResult.issuer;
    
    /**
     * Information about the payment card owner (name, company, etc.).
     */
    this.owner = nativeResult.owner;
    
    /**
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side.
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /**
     * The payment card's last month of validity.
     */
    this.validThru = nativeResult.validThru != null ? new Date(nativeResult.validThru) : null;
    
}

LegacyBlinkCardRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkCard.prototype.LegacyBlinkCardRecognizerResult = LegacyBlinkCardRecognizerResult;

/**
 * Recognizer used for scanning the front side of credit/debit cards.
 */
function LegacyBlinkCardRecognizer() {
    Recognizer.call(this, 'LegacyBlinkCardRecognizer');
    
    /**
     * Should anonymize the card number area (redact image pixels) on the document image result
     * 
     * 
     */
    this.anonymizeCardNumber = false;
    
    /**
     * Should anonymize the CVV on the document image result
     * 
     * 
     */
    this.anonymizeCvv = false;
    
    /**
     * Should anonymize the IBAN area (redact image pixels) on the document image result
     * 
     * 
     */
    this.anonymizeIban = false;
    
    /**
     * Should anonymize the owner area (redact image pixels) on the document image result
     * 
     * 
     */
    this.anonymizeOwner = false;
    
    /**
     * Defines if glare detection should be turned on/off.
     * 
     * 
     */
    this.detectGlare = true;
    
    /**
     * Should extract CVV
     * 
     * 
     */
    this.extractCvv = true;
    
    /**
     * Should extract the payment card's IBAN
     * 
     * 
     */
    this.extractIban = false;
    
    /**
     * Should extract the card's inventory number
     * 
     * 
     */
    this.extractInventoryNumber = true;
    
    /**
     * Should extract the card owner information
     * 
     * 
     */
    this.extractOwner = false;
    
    /**
     * Should extract the payment card's month of expiry
     * 
     * 
     */
    this.extractValidThru = true;
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     * 
     */
    this.returnFullDocumentImage = false;
    
    /**
     * Whether or not recognition result should be signed.
     * 
     * 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new LegacyBlinkCardRecognizerResult(nativeResult); }

}

LegacyBlinkCardRecognizer.prototype = new Recognizer('LegacyBlinkCardRecognizer');

BlinkCard.prototype.LegacyBlinkCardRecognizer = LegacyBlinkCardRecognizer;

// RECOGNIZERS

// export BlinkCardScanner
module.exports = new BlinkCard();