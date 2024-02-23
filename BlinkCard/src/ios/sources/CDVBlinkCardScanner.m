//
//  pdf417Plugin.m
//  CDVpdf417
//
//  Created by Jurica Cerovec, Marko Mihovilic on 10/01/13.
//  Copyright (c) 2013 Racuni.hr. All rights reserved.
//

/**
 * Copyright (c)2013 Racuni.hr d.o.o. All rights reserved.
 *
 * ANY UNAUTHORIZED USE OR SALE, DUPLICATION, OR DISTRIBUTION
 * OF THIS PROGRAM OR ANY OF ITS PARTS, IN SOURCE OR BINARY FORMS,
 * WITH OR WITHOUT MODIFICATION, WITH THE PURPOSE OF ACQUIRING
 * UNLAWFUL MATERIAL OR ANY OTHER BENEFIT IS PROHIBITED!
 * THIS PROGRAM IS PROTECTED BY COPYRIGHT LAWS AND YOU MAY NOT
 * REVERSE ENGINEER, DECOMPILE, OR DISASSEMBLE IT.
 */

#import "CDVBlinkCardScanner.h"

#import "MBCOverlayViewControllerDelegate.h"
#import "MBCRecognizerSerializers.h"
#import "MBCOverlaySettingsSerializers.h"
#import "MBCRecognizerWrapper.h"
#import "MBCSerializationUtils.h"

#import <BlinkCard/BlinkCard.h>

@interface CDVPlugin () <MBCOverlayViewControllerDelegate>

@property (nonatomic, retain) CDVInvokedUrlCommand *lastCommand;

@end

@interface CDVBlinkCardScanner ()

@property (nonatomic, strong) MBCRecognizerCollection *recognizerCollection;
@property (nonatomic) id<MBCRecognizerRunnerViewController> scanningViewController;

@property (class, nonatomic, readonly) NSString *RESULT_LIST;
@property (class, nonatomic, readonly) NSString *CANCELLED;
@property (class, nonatomic, readonly) int COMPRESSED_IMAGE_QUALITY;

@end

@implementation CDVBlinkCardScanner

@synthesize lastCommand;

/**
 Method  sanitizes the dictionary replaces all occurances of NSNull with nil

 @param dictionary JSON objects
 @return new dictionary with NSNull values replaced with nil
*/
- (NSDictionary *)sanitizeDictionary:(NSDictionary *)dictionary {
    NSMutableDictionary *mutableDictionary = [[NSMutableDictionary alloc] initWithDictionary:dictionary];
    for (NSString* key in dictionary.allKeys) {
        if (mutableDictionary[key] == [NSNull null]) {
            mutableDictionary[key] = nil;
        }
    }
    return mutableDictionary;
}

#pragma mark - Main
- (void)scanWithCamera:(CDVInvokedUrlCommand *)command {

    [self setLastCommand:command];

    NSDictionary *jsonOverlaySettings = [self sanitizeDictionary:[self.lastCommand argumentAtIndex:0]];
    NSDictionary *jsonRecognizerCollection = [self sanitizeDictionary:[self.lastCommand argumentAtIndex:1]];
    NSDictionary *jsonLicenses = [self sanitizeDictionary:[self.lastCommand argumentAtIndex:2]];

    [self setLicense:jsonLicenses];
    [self setLanguage:(NSString *)jsonOverlaySettings[@"language"] country:(NSString *)jsonOverlaySettings[@"country"]];

    self.recognizerCollection = [[MBCRecognizerSerializers sharedInstance] deserializeRecognizerCollection:jsonRecognizerCollection];

    // create overlay VC
    MBCOverlayViewController *overlayVC = [[MBCOverlaySettingsSerializers sharedInstance] createOverlayViewController:jsonOverlaySettings recognizerCollection:self.recognizerCollection delegate:self];

    UIViewController<MBCRecognizerRunnerViewController>* recognizerRunnerViewController = [MBCViewControllerFactory recognizerRunnerViewControllerWithOverlayViewController:overlayVC];

    self.scanningViewController = recognizerRunnerViewController;

    /** You can use other presentation methods as well */
    [[self viewController] presentViewController:recognizerRunnerViewController animated:YES completion:nil];
}

- (void)setLicense:(NSDictionary*) jsonLicense {
    __weak CDVBlinkCardScanner *weakSelf = self;
    
    if ([jsonLicense objectForKey:@"showTrialLicenseWarning"] != nil) {
        BOOL showTrialLicenseWarning = [[jsonLicense objectForKey:@"showTrialLicenseWarning"] boolValue];
        [MBCMicroblinkSDK sharedInstance].showTrialLicenseWarning = showTrialLicenseWarning;
    }
    NSString* iosLicense = [jsonLicense objectForKey:@"ios"];
    if ([jsonLicense objectForKey:@"licensee"] != nil) {
        NSString *licensee = [jsonLicense objectForKey:@"licensee"];
        [[MBCMicroblinkSDK sharedInstance] setLicenseKey:iosLicense andLicensee:licensee errorCallback:^(MBCLicenseError licenseError) {
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[CDVBlinkCardScanner licenseErrorToString:licenseError]];
            [weakSelf.commandDelegate sendPluginResult:result callbackId:weakSelf.lastCommand.callbackId];
        }];
    }
    else {
        [[MBCMicroblinkSDK sharedInstance] setLicenseKey:iosLicense errorCallback:^(MBCLicenseError licenseError) {
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[CDVBlinkCardScanner licenseErrorToString:licenseError]];
            [weakSelf.commandDelegate sendPluginResult:result callbackId:weakSelf.lastCommand.callbackId];
        }];
    }

}

- (void)setLanguage:(NSString *)language country:(NSString *)country {
    if (language != nil) {
        if (country != nil && ![country isEqualToString:@""]) {
            MBCMicroblinkApp.sharedInstance.language = [[language stringByAppendingString:@"-"] stringByAppendingString:country];
        } else {
            MBCMicroblinkApp.sharedInstance.language = language;
        }
    }
}

- (void)overlayViewControllerDidFinishScanning:(MBCOverlayViewController *)overlayViewController state:(MBCRecognizerResultState)state {
    if (state != MBCRecognizerResultStateEmpty) {
        [overlayViewController.recognizerRunnerViewController pauseScanning];
        // recognizers within self.recognizerCollection now have their results filled

        NSMutableArray *jsonResults = [[NSMutableArray alloc] initWithCapacity:self.recognizerCollection.recognizerList.count];
        for (NSUInteger i = 0; i < self.recognizerCollection.recognizerList.count; ++i) {
            [jsonResults addObject:[[self.recognizerCollection.recognizerList objectAtIndex:i] serializeResult]];
        }

        NSDictionary *resultDict;
            resultDict = @{
                CDVBlinkCardScanner.CANCELLED: [NSNumber numberWithBool:NO],
                CDVBlinkCardScanner.RESULT_LIST: jsonResults
            };

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:resultDict];
        [self.commandDelegate sendPluginResult:result callbackId:self.lastCommand.callbackId];

        // dismiss recognizer runner view controller
        dispatch_async(dispatch_get_main_queue(), ^{
            [[self viewController] dismissViewControllerAnimated:YES completion:nil];
            self.recognizerCollection = nil;
            self.scanningViewController = nil;
        });
    }
}

- (void)overlayDidTapClose:(MBCOverlayViewController *)overlayViewController {
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
    self.recognizerCollection = nil;
    self.scanningViewController = nil;
    NSDictionary *resultDict = @{
        CDVBlinkCardScanner.CANCELLED : [NSNumber numberWithBool:YES]
    };
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:resultDict];
    [self.commandDelegate sendPluginResult:result callbackId:self.lastCommand.callbackId];
}

+ (NSString *)RESULT_LIST {
    return @"resultList";
}

+ (NSString *)CANCELLED {
    return @"cancelled";
}

+ (int)COMPRESSED_IMAGE_QUALITY {
    return 90;
}

+ (NSString *)licenseErrorToString:(MBCLicenseError)licenseError {
    switch(licenseError) {
        case MBCLicenseErrorNetworkRequired:
            return @"License error network required";
            break;
        case MBCLicenseErrorUnableToDoRemoteLicenceCheck:
            return @"License error unable to do remote licence check";
            break;
        case MBCLicenseErrorLicenseIsLocked:
            return @"License error license is locked";
            break;
        case MBCLicenseErrorLicenseCheckFailed:
            return @"License error license check failed";
            break;
        case MBCLicenseErrorInvalidLicense:
            return @"License error invalid license";
            break;
        case MBCLicenseErrorPermissionExpired:
            return @"License error permission expired";
            break;
        case MBCLicenseErrorPayloadCorrupted:
            return @"License error payload corrupted";
            break;
        case MBCLicenseErrorPayloadSignatureVerificationFailed:
            return @"License error payload signature verification failed";
            break;
        case MBCLicenseErrorIncorrectTokenState:
            return @"License error incorrect token state";
            break;
    }
}

@end