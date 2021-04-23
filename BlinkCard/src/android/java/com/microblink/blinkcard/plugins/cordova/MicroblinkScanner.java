/**
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Matt Kane 2010
 * Copyright (c) 2011, IBM Corporation
 * Copyright (c) 2013, Maciej Nux Jaros
 */
package com.microblink.blinkcard.plugins.cordova;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

import com.microblink.blinkcard.MicroblinkSDK;
import com.microblink.blinkcard.entities.recognizers.RecognizerBundle;
import com.microblink.blinkcard.intent.IntentDataTransferMode;
import com.microblink.blinkcard.uisettings.UISettings;
import com.microblink.blinkcard.plugins.cordova.overlays.OverlaySettingsSerializers;
import com.microblink.blinkcard.plugins.cordova.recognizers.RecognizerSerializers;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class MicroblinkScanner extends CordovaPlugin {

    private static final int REQUEST_CODE = 1337;

    private static final String SCAN_WITH_CAMERA = "scanWithCamera";
    private static final String CANCELLED = "cancelled";

    private static final String RESULT_LIST = "resultList";

    private RecognizerBundle mRecognizerBundle;
    private CallbackContext mCallbackContext;

    /**
     * Constructor.
     */
    public MicroblinkScanner() {
    }

    /**
     * Executes the request.
     *
     * This method is called from the WebView thread. To do a non-trivial amount
     * of work, use: cordova.getThreadPool().execute(runnable);
     *
     * To run on the UI thread, use:
     * cordova.getActivity().runOnUiThread(runnable);
     *
     * @param action
     *            The action to execute.
     * @param args
     *            The exec() arguments.
     * @param callbackContext
     *            The callback context used when calling back into JavaScript.
     * @return Whether the action was valid.
     *
     * @sa
     *     https://github.com/apache/cordova-android/blob/master/framework/src/org
     *     /apache/cordova/CordovaPlugin.java
     */
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        mCallbackContext = callbackContext;

        try {
            if (action.equals(SCAN_WITH_CAMERA)) {
                JSONObject jsonOverlaySettings = args.getJSONObject(0);
                JSONObject jsonRecognizerCollection = args.getJSONObject(1);
                JSONObject jsonLicenses = args.getJSONObject(2);

                setLicense(jsonLicenses);
                mRecognizerBundle = RecognizerSerializers.INSTANCE.deserializeRecognizerCollection(jsonRecognizerCollection);
                UISettings overlaySettings = OverlaySettingsSerializers.INSTANCE.getOverlaySettings(this.cordova.getContext(), jsonOverlaySettings, mRecognizerBundle);

                // unable to use ActivityRunner because we need to use cordova's activity launcher
                Intent intent = new Intent(this.cordova.getContext(), overlaySettings.getTargetActivity());
                overlaySettings.saveToIntent(intent);
                this.cordova.startActivityForResult(this, intent, REQUEST_CODE);
            } else {
                return false;
            }
            return true;
        } catch (JSONException e) {
            mCallbackContext.error("JSON error: " + e.getMessage());
            return false;
        }
    }

    private void setLicense( JSONObject jsonLicense ) throws JSONException {
        MicroblinkSDK.setShowTrialLicenseWarning(
                jsonLicense.optBoolean("showTrialLicenseKeyWarning", true)
        );
        String androidLicense = jsonLicense.getString("android");
        String licensee = jsonLicense.optString("licensee", null);
        Context context = cordova.getContext();
        if (licensee == null) {
            MicroblinkSDK.setLicenseKey(androidLicense, context);
        } else {
            MicroblinkSDK.setLicenseKey(androidLicense, licensee, context);
        }
        MicroblinkSDK.setIntentDataTransferMode(IntentDataTransferMode.PERSISTED_OPTIMISED);
    }

    /**
     * Called when the scanner intent completes.
     *
     * @param requestCode
     *            The request code originally supplied to
     *            startActivityForResult(), allowing you to identify who this
     *            result came from.
     * @param resultCode
     *            The integer result code returned by the child activity through
     *            its setResult().
     * @param data
     *            An Intent, which can return result data to the caller (various
     *            data can be attached to Intent "extras").
     */
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {

        if (resultCode == Activity.RESULT_OK) {

            JSONObject result = new JSONObject();
            try {
                result.put(CANCELLED, false);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

            if (requestCode == REQUEST_CODE) {
                mRecognizerBundle.loadFromIntent(data);
                try {
                    JSONArray resultList = RecognizerSerializers.INSTANCE.serializeRecognizerResults(mRecognizerBundle.getRecognizers());
                    result.put(RESULT_LIST, resultList);
                } catch(JSONException e) {
                    throw new RuntimeException(e);
                }
            }
            mCallbackContext.success(result);
        } else if (resultCode == Activity.RESULT_CANCELED) {
            JSONObject obj = new JSONObject();
            try {
                obj.put(CANCELLED, true);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            mCallbackContext.success(obj);

        } else {
            mCallbackContext.error("Unexpected error");
        }

    }
}