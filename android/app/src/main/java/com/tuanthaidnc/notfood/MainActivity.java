package com.tuanthaidnc.notfood;

import com.getcapacitor.BridgeActivity;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NotDisplayPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null) {
            getBridge().getWebView().getSettings().setTextZoom(Math.round(getResources().getConfiguration().fontScale * 100));
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) requestSmoothDisplay();
    }

    @Override
    public void onResume() {
        super.onResume();
        requestSmoothDisplay();
    }

    private void requestSmoothDisplay() {
        if (getBridge() == null) return;
        Display display = getWindowManager().getDefaultDisplay();
        Display.Mode current = display.getMode();
        Display.Mode best = current;
        for (Display.Mode candidate : display.getSupportedModes()) {
            if (candidate.getPhysicalWidth() == current.getPhysicalWidth()
                    && candidate.getPhysicalHeight() == current.getPhysicalHeight()
                    && candidate.getRefreshRate() <= 120.5f
                    && candidate.getRefreshRate() > best.getRefreshRate()) best = candidate;
        }
        WindowManager.LayoutParams attributes = getWindow().getAttributes();
        attributes.preferredDisplayModeId = best.getModeId();
        attributes.preferredRefreshRate = best.getRefreshRate();
        getWindow().setAttributes(attributes);
        if (Build.VERSION.SDK_INT >= 35) {
            getBridge().getWebView().setRequestedFrameRate(best.getRefreshRate());
        }
    }
}
