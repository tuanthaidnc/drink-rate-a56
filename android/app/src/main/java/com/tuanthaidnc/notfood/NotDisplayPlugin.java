package com.tuanthaidnc.notfood;

import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotDisplay")
public class NotDisplayPlugin extends Plugin {
    @PluginMethod
    public void preferences(PluginCall call) {
        JSObject result = new JSObject();
        float scale = Settings.Global.getFloat(getContext().getContentResolver(), Settings.Global.ANIMATOR_DURATION_SCALE, 1f);
        result.put("reducedMotion", scale == 0);
        result.put("refreshRate", getActivity().getWindowManager().getDefaultDisplay().getRefreshRate());
        call.resolve(result);
    }
}
