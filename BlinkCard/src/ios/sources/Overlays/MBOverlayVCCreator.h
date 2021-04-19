//
//  MBOverlaySettingsSerialization.h
//  BlinkIdDevDemo
//
//  Created by DoDo on 04/06/2018.
//

#pragma once

#import "MBOverlayViewControllerDelegate.h"

#import <BlinkCard/BlinkCard.h>
#import <Foundation/Foundation.h>

@protocol MBCOverlayVCCreator
@required

-(MBCOverlayViewController *) createOverlayViewController:(NSDictionary *)jsonOverlaySettings recognizerCollection:(MBCRecognizerCollection*)recognizerCollection delegate:(id<MBCOverlayViewControllerDelegate>) delegate;

@property (nonatomic, nonnull, readonly) NSString *jsonName;

@end