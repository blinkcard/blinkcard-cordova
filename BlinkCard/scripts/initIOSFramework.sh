#!/bin/bash

# enter into ios project folder
HERE="$(dirname "$(test -L "$0" && readlink "$0" || echo "$0")")"
pushd "${HERE}/../src/ios/" > /dev/null

LINK='https://github.com/BlinkCard/blinkcard-ios/releases/download/v2.9.0/BlinkCard.xcframework.zip'
FILENAME='BlinkCard.xcframework.zip'

# BlinkCard framework will be obtained via wget or curl
if which wget >/dev/null ; then
    echo "Downloading BlinkCard framework via wget:"
    wget -O "${FILENAME}" "${LINK}" -nv --show-progress || ( echo "ERROR: couldn't download BlinkCard framework, something went wrong while downloading framework from ${LINK}" && exit 1 )
elif which curl >/dev/null ; then
    echo "Downloading BlinkCard framework via curl:"
    curl -o "${FILENAME}" -L "${LINK}" --progress-bar --show-error || ( echo "ERROR: couldn't download BlinkCard framework, something went wrong while downloading framework from ${LINK}" && exit 1 )
else
    echo "Couldn't download BlinkID framework, neither wget nor curl is available."
fi

if [ -d 'Microblink.bundle' ] ; then
    rm -rf Microblink.bundle && echo "Removing Microblink.bundle"
fi

if [ -d 'Microblink.framework' ] ; then
    rm -rf Microblink.framework && echo "Removing Microblink.framework"
fi 


if [ -d 'Microblink.xcframework' ] ; then
    rm -rf Microblink.xcframework && echo "Removing Microblink.xcframework"
fi 

if [ -d 'BlinkCard.xcframework' ] ; then
    rm -rf BlinkCard.xcframework && echo "Removing BlinkCard.xcframework"
fi 

echo "Unzipping ${FILENAME}"
unzip -v > /dev/null 2>&1 || { echo "ERROR: couldn't unzip BlinkCard xcframework, install unzip" && exit 1; }
unzip -o "${FILENAME}" > /dev/null 2>&1 && echo "Unzipped ${FILENAME}"

echo "Removing unnecessary files"

rm -rfv BlinkCard.xcframework.zip >/dev/null 2>&1
rm "${FILENAME}" >/dev/null 2>&1

popd
