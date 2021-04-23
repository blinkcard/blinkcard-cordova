package com.microblink.blinkcard.plugins.cordova.recognizers;

import com.microblink.blinkcard.entities.recognizers.Recognizer;

import org.json.JSONObject;

public interface RecognizerSerialization {
    Recognizer<?> createRecognizer(JSONObject jsonObject);
    JSONObject serializeResult(Recognizer<?> recognizer);

    String getJsonName();
    Class<?> getRecognizerClass();
}