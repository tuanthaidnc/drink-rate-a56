package com.tuanthaidnc.notfood;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "NotCamera", permissions = {
    @Permission(alias = "camera", strings = {Manifest.permission.CAMERA})
})
public class NotCameraPlugin extends Plugin {
    @PluginMethod
    public void capture(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "permissionResult");
            return;
        }
        startActivityForResult(call, new Intent(getContext(), SquareCameraActivity.class), "captureResult");
    }

    @PermissionCallback
    private void permissionResult(PluginCall call) {
        if (getPermissionState("camera") == PermissionState.GRANTED) capture(call);
        else call.reject("Camera permission denied", "PERMISSION_DENIED");
    }

    @ActivityCallback
    private void captureResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null) {
            if (data != null && data.hasExtra("error")) call.reject(data.getStringExtra("error"));
            else call.reject("Camera cancelled", "CANCELLED");
            return;
        }
        JSObject response = new JSObject();
        response.put("uri", data.getStringExtra("uri"));
        call.resolve(response);
    }
}
