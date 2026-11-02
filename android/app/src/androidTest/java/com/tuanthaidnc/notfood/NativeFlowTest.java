package com.tuanthaidnc.notfood;

import static org.junit.Assert.*;
import android.webkit.WebView;
import android.app.Activity;
import android.graphics.Bitmap;
import android.view.KeyEvent;
import androidx.camera.view.PreviewView;
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry;
import androidx.test.runner.lifecycle.Stage;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.Until;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class NativeFlowTest {
    private WebView web;
    private final UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    private File proof;

    private Object js(String expression) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.evaluateJavascript(expression, value -> { result.set(value); latch.countDown(); }));
        assertTrue("WebView JavaScript callback", latch.await(10, TimeUnit.SECONDS));
        return new JSONTokener(result.get()).nextValue();
    }
    private void until(String expression) throws Exception {
        long deadline = System.currentTimeMillis() + 20000;
        do {
            if (Boolean.TRUE.equals(js(expression))) return;
            Thread.sleep(60);
        } while (System.currentTimeMillis() < deadline);
        fail("Timed out: " + expression + " / " + js("document.body.innerText"));
    }
    private void tap(String selector) throws Exception {
        String quoted = JSONObject.quote(selector);
        until("!!document.querySelector(" + quoted + ")");
        js("document.querySelector(" + quoted + ").scrollIntoView({behavior:'instant',block:'center',inline:'nearest'})");
        JSONObject box = new JSONObject((String) js("JSON.stringify((()=>{const r=document.querySelector(" + quoted + ").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,viewport:innerWidth}})())"));
        int[] origin = new int[2];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.getLocationOnScreen(origin));
        double ratio = web.getWidth() / box.getDouble("viewport");
        assertTrue(device.click(origin[0] + (int)(box.getDouble("x") * ratio), origin[1] + (int)(box.getDouble("y") * ratio)));
    }
    private void enterText(String selector, String value) throws Exception {
        tap(selector);
        until("document.activeElement===document.querySelector(" + JSONObject.quote(selector) + ")");
        device.pressKeyCode(KeyEvent.KEYCODE_A, KeyEvent.META_CTRL_ON);
        device.executeShellCommand("input text " + value);
        until("document.querySelector(" + JSONObject.quote(selector) + ").value===" + JSONObject.quote(value));
    }
    private void nav(int index) throws Exception {
        tap(".bottom-dock button:nth-child(" + (index + 1) + ")");
        until("document.querySelectorAll('.app-scene').length===1 && !!document.querySelector('.app-scene[data-screen-index=\"" + index + "\"]:not([aria-hidden=\"true\"])')");
    }
    private void screenshot(String name) throws Exception {
        Thread.sleep(550);
        assertTrue(device.takeScreenshot(new File(proof, name + ".png")));
    }

    private void waitForLiveCameraFrame() throws Exception {
        AtomicBoolean visibleFrame = new AtomicBoolean(false);
        long deadline = System.currentTimeMillis() + 20000;
        do {
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
                for (Activity activity : ActivityLifecycleMonitorRegistry.getInstance().getActivitiesInStage(Stage.RESUMED)) {
                    if (!(activity instanceof SquareCameraActivity)) continue;
                    PreviewView preview = activity.findViewById(R.id.camera_preview);
                    if (preview.getPreviewStreamState().getValue() != PreviewView.StreamState.STREAMING) continue;
                    Bitmap bitmap = preview.getBitmap();
                    if (bitmap == null) continue;
                    try {
                        for (int y = 1; y < 16 && !visibleFrame.get(); y++) {
                            for (int x = 1; x < 16; x++) {
                                int pixel = bitmap.getPixel(x * bitmap.getWidth() / 16, y * bitmap.getHeight() / 16);
                                if (android.graphics.Color.red(pixel) + android.graphics.Color.green(pixel) + android.graphics.Color.blue(pixel) > 90) {
                                    visibleFrame.set(true);
                                    break;
                                }
                            }
                        }
                    } finally { bitmap.recycle(); }
                }
            });
            if (!visibleFrame.get()) Thread.sleep(100);
        } while (!visibleFrame.get() && System.currentTimeMillis() < deadline);
        assertTrue("The emulated camera has produced a visible live preview frame", visibleFrame.get());
    }

    private void assertDockGeometry() throws Exception {
        assertTrue("Circular action, aligned labels, and visible touch targets", (Boolean) js("(()=>{const buttons=[...document.querySelectorAll('.bottom-dock button')];const labels=buttons.map(b=>b.querySelector('.nav-label').getBoundingClientRect());return buttons.length===5&&buttons.every((b,i)=>{const r=b.getBoundingClientRect(),icon=b.querySelector('.nav-icon').getBoundingClientRect(),label=labels[i];return r.width>=48&&r.height>=48&&Math.abs(icon.width-icon.height)<0.5&&Math.abs(label.y-labels[0].y)<0.5&&label.bottom<=r.bottom+1})})()"));
    }

    @Test public void nativeWebViewFlowAndInsets() throws Exception {
        String oldScale = device.executeShellCommand("settings get system font_scale").trim();
        proof = new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getExternalFilesDir(null), "qa");
        assertTrue(proof.exists() || proof.mkdirs());
        // Isolated CI emulator permissions; physical A56 permissions are user-controlled.
        InstrumentationRegistry.getInstrumentation().getUiAutomation().grantRuntimePermission("com.tuanthaidnc.notfood", android.Manifest.permission.ACCESS_COARSE_LOCATION);
        InstrumentationRegistry.getInstrumentation().getUiAutomation().grantRuntimePermission("com.tuanthaidnc.notfood", android.Manifest.permission.ACCESS_FINE_LOCATION);
        InstrumentationRegistry.getInstrumentation().getUiAutomation().grantRuntimePermission("com.tuanthaidnc.notfood", android.Manifest.permission.CAMERA);
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> web = activity.getBridge().getWebView());
            until("!!document.querySelector('.bottom-dock')");
            // The emulator can omit the WebView accessibility root on cold launch.
            // Native window focus, followed by an actual camera-launch touch, is
            // the input readiness signal; an empty AX tree is not a UI failure.
            device.waitForIdle();
            screenshot("native-launch");
            AtomicBoolean focused = new AtomicBoolean(false);
            long focusDeadline = System.currentTimeMillis() + 15000;
            do {
                // The isolated emulator's Quickstep can show a launcher ANR on
                // first boot. Dismiss only that known system dialog; app ANRs
                // remain visible failures, never a generalized retry or bypass.
                if (device.hasObject(By.textContains("Quickstep")) && device.hasObject(By.res("android:id/aerr_close"))) {
                    screenshot("emulator-quickstep-anr");
                    device.findObject(By.res("android:id/aerr_close")).click();
                }
                scenario.onActivity(activity -> focused.set(activity.hasWindowFocus() && web.isShown()));
                if (!focused.get()) Thread.sleep(100);
            } while (!focused.get() && System.currentTimeMillis() < focusDeadline);
            assertTrue("NỐT native window is visible and has input focus", focused.get());
            screenshot("native-launch");
            assertDockGeometry();
            assertEquals("android", js("document.documentElement.dataset.platform"));
            assertEquals("https://localhost", js("location.origin"));
            assertFalse("No service worker is needed for bundled assets", (Boolean) js("!!navigator.serviceWorker.controller"));
            nav(2);
            tap(".experience-option:nth-child(2)");
            assertTrue("In-app square camera opened", device.wait(Until.hasObject(By.res("com.tuanthaidnc.notfood:id/camera_preview")), 15000));
            android.graphics.Rect previewBounds = device.findObject(By.res("com.tuanthaidnc.notfood:id/camera_preview")).getVisibleBounds();
            assertEquals("Square camera preview", previewBounds.width(), previewBounds.height());
            waitForLiveCameraFrame();
            screenshot("native-square-camera");
            device.pressBack();
            until("document.querySelector('.review-form')?.dataset.stage==='capture' && !document.querySelector('.capture-processing')");
            assertFalse("No scoring before a photo", (Boolean)js("!!document.querySelector('#shop-name-input')"));
            nav(4);
            assertFalse("Cancelled capture stays pristine", (Boolean)js("!!document.querySelector('[role=dialog]')"));
            nav(0);
            nav(2);
            tap(".shutter-button");
            assertTrue(device.wait(Until.hasObject(By.res("com.tuanthaidnc.notfood:id/camera_shutter").enabled(true)), 15000));
            device.findObject(By.res("com.tuanthaidnc.notfood:id/camera_shutter")).click();
            until("document.querySelector('.review-form')?.dataset.stage==='score'");
            until("document.querySelector('.quick-photo img')?.naturalWidth>0");
            assertTrue("Square output and direct return without confirmation", (Boolean)js("(()=>{const p=document.querySelector('.quick-photo img');return p.naturalWidth===p.naturalHeight})()"));
            tap(".quick-location");
            until("!!document.querySelector('[role=dialog]')");
            tap(".manual-coordinates");
            enterText(".capture-location .two-columns label:nth-child(1) input", "16.066");
            enterText(".capture-location .two-columns label:nth-child(2) input", "108.209");
            device.pressBack();
            js("document.querySelector('.capture-location .two-columns').scrollIntoView({block:'center'})");
            // The only secondary action in this manual-entry group is Đặt ghim.
            tap(".capture-location > .stack > button");
            until("!document.querySelector('.capture-location .two-columns')");
            js("document.querySelector('.confirm-location').scrollIntoView({block:'center'})");
            tap(".confirm-location");
            until("!document.querySelector('[role=dialog]')");
            tap(".quick-more > summary");
            until("!!document.querySelector('#shop-name-input')");
            enterText("#shop-name-input", "Native-QA");
            enterText("#review-price", "31,5");
            until("document.querySelector('.not-app').classList.contains('is-typing')");
            assertTrue("IME must not collapse the main grid row or hide the focused price", (Boolean)js("(()=>{const m=document.querySelector('.app-main'),e=document.querySelector('#review-price'),r=e.getBoundingClientRect();return m.clientHeight>180&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e})()"));
            screenshot("native-keyboard");
            device.pressBack();
            until("!!document.querySelector('.quick-toolbar')");
            js("document.querySelector('.review-form').scrollIntoView({block:'start'})");
            tap(".quick-toolbar button[type=submit]");
            until("!!document.querySelector('.album-entry')");
            screenshot("native-list-dark");
            nav(3);
            until("!!document.querySelector('.journal-calendar')");
            screenshot("native-journal");
            for (int i : new int[] {4, 0, 1, 4, 0, 4}) nav(i);
            until("!!document.querySelector('[data-stat=average]')");
            assertEquals("7.7", js("document.querySelector('[data-stat=average]').textContent"));
            assertEquals(1, ((Number)js("document.querySelectorAll('.app-scene').length")).intValue());
            assertTrue((Boolean)js("(()=>{const e=document.querySelector('[data-stat=average]');return getComputedStyle(e).color!==getComputedStyle(e.parentElement).backgroundColor})()"));
            assertTrue((Boolean)js("document.documentElement.scrollWidth<=innerWidth"));
            screenshot("native-insights-dark");
            assertDockGeometry();
            tap(".theme-toggle");
            until("document.documentElement.dataset.theme==='light'");
            screenshot("native-insights-light");
            tap(".header-actions button[aria-label='Tùy chọn']");
            until("!!document.querySelector('[role=dialog]')");
            device.pressBack();
            until("!document.querySelector('[role=dialog]')");
            nav(0);
            tap(".album-tile");
            until("!!document.querySelector('.review-inspector')");
            tap(".inspector-actions button[title='Sửa đánh giá']");
            until("!!document.querySelector('#shop-name-input')");
            screenshot("native-form");
            assertEquals(0,((Number)js("document.querySelectorAll('input[type=date],input[type=time]').length")).intValue());
            assertEquals(4,((Number)js("document.querySelectorAll('.quick-sliders [role=slider]').length")).intValue());
            JSONObject circle = new JSONObject((String)js("JSON.stringify((()=>{const r=document.querySelector('.rating-slider-thumb').getBoundingClientRect();return {width:r.width,height:r.height}})())"));
            assertEquals(circle.getDouble("width"), circle.getDouble("height"), 1);
            device.pressBack();
            until("!!document.querySelector('.album-entry')");
            assertFalse((Boolean)js("!!document.querySelector('[role=dialog]')"));
            device.executeShellCommand("settings put system font_scale 1.3");
            Thread.sleep(1000);
            scenario.onActivity(activity -> web = activity.getBridge().getWebView());
            until("!!document.querySelector('.bottom-dock')");
            nav(4);
            screenshot("native-font-130");
            assertDockGeometry();
            assertTrue((Boolean)js("document.documentElement.scrollWidth<=innerWidth"));
            device.setOrientationLeft();
            until("innerWidth>innerHeight");
            screenshot("native-landscape");
            assertTrue((Boolean)js("document.documentElement.scrollWidth<=innerWidth"));
            JSONObject result = new JSONObject();
            result.put("pass", true);
            result.put("source", "Android API 35 emulator, native touch, IME, system Back, real WebView");
            result.put("score", "7.7");
            result.put("fontScale", "1.3");
            result.put("circle", circle);
            result.put("viewport", js("innerWidth+'x'+innerHeight"));
            result.put("physical120HzVerified", false);
            result.put("automaticCameraAndCleanCancel", true);
            result.put("actualSquareCameraAndManualLocation", true);
            Files.write(new File(proof, "native-results.json").toPath(), result.toString(2).getBytes(StandardCharsets.UTF_8));
        } finally {
            // The Gradle device provider uninstalls the app after the test,
            // which removes its external-files directory before adb can pull it.
            device.executeShellCommand("mkdir -p /sdcard/Download/not-ci-qa");
            device.executeShellCommand("cp -R " + proof.getAbsolutePath() + "/. /sdcard/Download/not-ci-qa/");
            device.setOrientationNatural();
            device.unfreezeRotation();
            device.executeShellCommand("settings put system font_scale " + (oldScale.equals("null") ? "1.0" : oldScale));
        }
    }
}
