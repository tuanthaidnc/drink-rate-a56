package com.tuanthaidnc.notfood;

import android.provider.Settings;
import android.graphics.Color;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotDisplay")
public class NotDisplayPlugin extends Plugin {
    @PluginMethod
    public void appearance(PluginCall call) {
        final boolean dark = call.getBoolean("dark", true);
        getActivity().runOnUiThread(() -> {
            int color = dark ? Color.rgb(11, 13, 12) : Color.rgb(247, 248, 245);
            // SystemBars styles the glyphs but derives this inset backing from
            // the OS theme. Keep it with the app theme, including old WebViews.
            getActivity().getWindow().getDecorView().setBackgroundColor(color);
            getBridge().getWebView().setBackgroundColor(color);
            call.resolve();
        });
    }

    @PluginMethod
    public void preferences(PluginCall call) {
        JSObject result = new JSObject();
        float scale = Settings.Global.getFloat(getContext().getContentResolver(), Settings.Global.ANIMATOR_DURATION_SCALE, 1f);
        result.put("reducedMotion", scale == 0);
        result.put("refreshRate", getActivity().getWindowManager().getDefaultDisplay().getRefreshRate());
        call.resolve(result);
    }
}
