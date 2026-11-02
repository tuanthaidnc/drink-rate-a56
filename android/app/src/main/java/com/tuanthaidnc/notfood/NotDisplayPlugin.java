package com.tuanthaidnc.notfood;

import android.provider.Settings;
import android.graphics.Color;
import android.content.res.Configuration;
import android.os.Build;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.Window;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotDisplay")
public class NotDisplayPlugin extends Plugin {
    private Boolean darkTheme;
    private Boolean keyboardVisible;
    private ViewTreeObserver.OnGlobalLayoutListener keyboardListener;

    @Override public void load() {
        getActivity().runOnUiThread(() -> {
            View decor = getActivity().getWindow().getDecorView();
            keyboardListener = () -> {
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
                if (insets == null) return;
                boolean visible = insets.isVisible(WindowInsetsCompat.Type.ime());
                if (keyboardVisible == null || keyboardVisible != visible) {
                    keyboardVisible = visible;
                    // IME ownership can reset navigation appearance on close.
                    // Reapply after its inset/layout update, without replacing
                    // Capacitor's existing keyboard/inset listener.
                    decor.post(this::applyAppearance);
                }
            };
            decor.getViewTreeObserver().addOnGlobalLayoutListener(keyboardListener);
        });
    }

    private void applyAppearance() {
        if (darkTheme == null) return;
        Window window = getActivity().getWindow();
        int color = darkTheme ? Color.rgb(11, 13, 12) : Color.rgb(247, 248, 245);
        window.getDecorView().setBackgroundColor(color);
        getBridge().getWebView().setBackgroundColor(color);
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(window, window.getDecorView());
        bars.setAppearanceLightStatusBars(!darkTheme);
        bars.setAppearanceLightNavigationBars(!darkTheme);
        if (Build.VERSION.SDK_INT >= 29) window.setNavigationBarContrastEnforced(false);
    }

    @Override protected void handleOnResume() {
        getActivity().getWindow().getDecorView().post(this::applyAppearance);
    }

    @Override protected void handleOnConfigurationChanged(Configuration configuration) {
        getActivity().getWindow().getDecorView().post(this::applyAppearance);
    }

    @Override protected void handleOnDestroy() {
        if (keyboardListener != null)
            getActivity().getWindow().getDecorView().getViewTreeObserver().removeOnGlobalLayoutListener(keyboardListener);
    }

    @PluginMethod
    public void appearance(PluginCall call) {
        final boolean dark = call.getBoolean("dark", true);
        getActivity().runOnUiThread(() -> {
            // SystemBars styles the glyphs but derives this inset backing from
            // the OS theme. Keep it with the app theme, including old WebViews.
            darkTheme = dark;
            applyAppearance();
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
