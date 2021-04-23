# BlinkCard SDK wrapper for Cordova

Enhance your Cordova cross-platform apps with an AI-driven mobile credit card scanner.

We made it quick and easy for you to create a sample application or install the plugin into your existing iOS or Android project.

For a full access to all features and functionalities, it’s best to go with one of our native SDKs (for [iOS](https://github.com/BlinkCard/blinkcard-ios) or [Android](https://github.com/BlinkCard/blinkcard-android)).

## Cordova version
BlinkCard Cordova requires Cordova **v7.0.0 or later** and cordova-android plugin **v8.0.0 or later**.

## Adding blinkcard-cordova to your application

You can add blinkcard-cordova by cloning the repository and following instructions below or by running

```shell
cordova plugin add blinkcard-cordova
```

In the repository you will find scripts to create sample applications.

## Clone or Download repository
Downloading a repository just downloads the files from the most recent commit of the default branch but without all the dependencies which are in submodules. We recommend that you clone directory. With a clone option you will get a copy of the history and it’s functional git repository.

To clone repository:

+ **Copy URL from the `Clone or download` button: https://github.com/BlinkCard/blinkcard-cordova.git**
+ **Open terminal on Mac/Linux or [GitBash](https://git-for-windows.github.io/) on Windows.**
+ **cd into directory where you want the cloned directory to be made.**
+ **Type `git clone ` , than past URL**
+ **Press enter**

## How to get started

### Cordova

Sample Cordova app is generated with a script

```shell
./initCordovaSampleApp.sh
```

To run iOS sample application open Xcode project found in `sample/platforms/ios/sample.xcodeproj` and set your signing team.

To run Android sample application type

```shell
cordova run android
```

### Licensing

- [Generate](https://microblink.com/login?url=/customer/generatedemolicence) a **free trial license key** to start using the SDK in your app (registration required)

- For production licensing, please [contact sales](https://microblink.com/contact-us) to request a quote.

**Keep in mind:** Versions 5.8.0 and above require an internet connection to work under our new License Management Program.

We’re only asking you to do this so we can validate your trial license key. Scanning or data extraction of identity documents still happens offline, on the device itself. 

Once the validation is complete, you can continue using the SDK in offline mode (or over a private network) until the next check.


## Installation

First generate a empty project if needed:

```shell
cordova create <path> <package> <name>
```

Initialize the iOS framework:

```shell
cd BlinkCard
./initIOSFramework.sh
cd ..
```

Add the **BlinkCard** plugin to your project:

```shell
cd <path_to_your_project>
cordova plugin add <blinkcard_plugin_path> # or blinkcard-cordova if you don't have blinkcard-cordova locally
```

### Android

Add Android platform support to the project:

    cordova platform add android@8
    
### iOS

> If you want to add iOS as a platform for your application, you will need to install **unzip** and **wget**.

Add iOS plaform support to the project:

    cordova platform add ios

## Sample

Here's a complete example of how to create and build a project for **Android** and **iOS**:

```shell
# pull the plugin and sample application from Github
git clone https://github.com/BlinkCard/blinkcard-cordova.git

# create a empty application
cordova create testcordova

cd testcordova

# add the BlinkCard plugin
cordova plugin add ../blinkcard-cordova/BlinkCard # or just 'blinkcard-cordova' if you don't have blinkcard-cordova locally

# add android support to the project
cordova platform add android@8

# build the project, the binary will appear in the bin/ folder
cordova build android

# add ios support to the project
cordova platform add ios

# build the project
cordova build ios
```

You can also use provided `initCordovaSampleApp.sh` script that will generate a sample app that uses the plugin:

```shell
./initCordovaSampleApp.sh
```

To run the script, you'll need BASH environment on Windows (Linux and MacOS use BASH by default).


## Usage

To use the plugin you call it in your Javascript code like the [sample application](www/js/index.js).

Documentation for all features and JS API is available in [blinkCardScanner.js JS API file](BlinkCard/www/blinkCardScanner.js).


## Changing scanner settings

To change scanner settings you need to modify Phonegap plugin classes for iOS and Android. Plugin classes are located in `./BlinkCard/src`. All necessary settings documentation is located in those source files. 

For platform specific implementation details refer to the [BlinkCard-iOS](https://github.com/BlinkCard/blinkcard-ios) and [BlinkCard-android](https://github.com/BlinkCard/blinkcard-android) documentation.
