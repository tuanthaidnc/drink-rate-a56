package com.tuanthaidnc.notfood;

import android.provider.Settings;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.ColorFilter;
import android.graphics.PixelFormat;
import android.content.res.Configuration;
import android.os.Build;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.Window;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.graphics.Insets;
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
    private Insets navigationInsets = Insets.NONE;
    private Insets tappableInsets = Insets.NONE;
    private NavigationProtection navigationProtection;

    @Override public void load() {
        getActivity().runOnUiThread(() -> {
            View decor = getActivity().getWindow().getDecorView();
            keyboardListener = () -> {
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
                if (insets == null) return;
                boolean visible = insets.isVisible(WindowInsetsCompat.Type.ime());
                Insets navigation = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
                Insets tappable = insets.getInsets(WindowInsetsCompat.Type.tappableElement());
                if (keyboardVisible == null || keyboardVisible != visible
                        || !navigation.equals(navigationInsets) || !tappable.equals(tappableInsets)) {
                    keyboardVisible = visible;
                    navigationInsets = navigation;
                    tappableInsets = tappable;
                    // IME ownership can reset navigation appearance on close.
                    // Reapply after its inset/layout update, without replacing
                    // Capacitor's existing keyboard/inset listener.
                    decor.post(this::applyAppearance);
                }
            };
            decor.getViewTreeObserver().addOnGlobalLayoutListener(keyboardListener);
        });
    }

    @SuppressWarnings("deprecation")
    private void applyAppearance() {
        if (darkTheme == null) return;
        Window window = getActivity().getWindow();
        View decor = window.getDecorView();
        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
        Insets navigation = insets == null ? Insets.NONE : insets.getInsets(WindowInsetsCompat.Type.navigationBars());
        Insets tappable = insets == null ? Insets.NONE : insets.getInsets(WindowInsetsCompat.Type.tappableElement());
        boolean buttons = tappable.bottom > 0 || tappable.left > 0 || tappable.right > 0;
        // Three-button navigation belongs to the system/launcher. Protect it
        // with the system surface and matching hints, independently of the
        // app theme. Gesture navigation continues the app canvas instead.
        boolean navigationDark = buttons
            ? (getContext().getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
            : darkTheme;
        int color = darkTheme ? Color.rgb(11, 13, 12) : Color.rgb(247, 248, 245);
        window.setNavigationBarColor(Color.TRANSPARENT);
        window.setBackgroundDrawable(new ColorDrawable(color));
        getBridge().getWebView().setBackgroundColor(color);
        if (navigationProtection == null) {
            navigationProtection = new NavigationProtection();
            decor.getOverlay().add(navigationProtection);
        }
        navigationProtection.insets = buttons ? navigation : Insets.NONE;
        navigationProtection.paint.setColor(navigationDark ? Color.rgb(11, 13, 12) : Color.rgb(247, 248, 245));
        navigationProtection.setBounds(0, 0, decor.getWidth(), decor.getHeight());
        navigationProtection.invalidateSelf();
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(window, decor);
        bars.setAppearanceLightStatusBars(!darkTheme);
        bars.setAppearanceLightNavigationBars(!navigationDark);
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
        if (navigationProtection != null)
            getActivity().getWindow().getDecorView().getOverlay().remove(navigationProtection);
    }

    private static class NavigationProtection extends Drawable {
        final Paint paint = new Paint();
        Insets insets = Insets.NONE;
        @Override public void draw(Canvas canvas) {
            int width = getBounds().width(), height = getBounds().height();
            if (insets.bottom > 0) canvas.drawRect(0, height - insets.bottom, width, height, paint);
            if (insets.left > 0) canvas.drawRect(0, 0, insets.left, height, paint);
            if (insets.right > 0) canvas.drawRect(width - insets.right, 0, width, height, paint);
        }
        @Override public void setAlpha(int alpha) { paint.setAlpha(alpha); }
        @Override public void setColorFilter(ColorFilter filter) { paint.setColorFilter(filter); }
        @Override public int getOpacity() { return PixelFormat.TRANSLUCENT; }
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
