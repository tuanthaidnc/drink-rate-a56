package com.tuanthaidnc.notfood;

import static org.junit.Assert.*;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
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
        JSONObject box = new JSONObject((String) js("JSON.stringify((()=>{const r=document.querySelector(" + quoted + ").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,viewport:innerWidth}})())"));
        int[] origin = new int[2];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.getLocationOnScreen(origin));
        double ratio = web.getWidth() / box.getDouble("viewport");
        assertTrue(device.click(origin[0] + (int)(box.getDouble("x") * ratio), origin[1] + (int)(box.getDouble("y") * ratio)));
    }
    private void nav(int index) throws Exception {
        tap(".bottom-dock button:nth-child(" + (index + 1) + ")");
        until("document.querySelectorAll('.app-scene').length===1 && !!document.querySelector('.app-scene[data-screen-index=\"" + index + "\"]:not([aria-hidden=\"true\"])')");
    }
    private void screenshot(String name) throws Exception {
        Thread.sleep(550);
        assertTrue(device.takeScreenshot(new File(proof, name + ".png")));
    }

    private void assertDockGeometry() throws Exception {
        assertTrue("Circular action, aligned labels, and visible touch targets", (Boolean) js("(()=>{const buttons=[...document.querySelectorAll('.bottom-dock button')];const labels=buttons.map(b=>b.querySelector('.nav-label').getBoundingClientRect());return buttons.length===4&&buttons.every((b,i)=>{const r=b.getBoundingClientRect(),icon=b.querySelector('.nav-icon').getBoundingClientRect(),label=labels[i];return r.width>=48&&r.height>=48&&Math.abs(icon.width-icon.height)<0.5&&Math.abs(label.y-labels[0].y)<0.5&&label.bottom<=r.bottom+1})})()"));
    }

    @Test public void nativeWebViewFlowAndInsets() throws Exception {
        String oldScale = device.executeShellCommand("settings get system font_scale").trim();
        proof = new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getExternalFilesDir(null), "qa");
        assertTrue(proof.exists() || proof.mkdirs());
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> web = activity.getBridge().getWebView());
            until("!!document.querySelector('.bottom-dock')");
            assertDockGeometry();
            assertEquals("android", js("document.documentElement.dataset.platform"));
            assertEquals("https://localhost", js("location.origin"));
            assertFalse("No service worker is needed for bundled assets", (Boolean) js("!!navigator.serviceWorker.controller"));
            nav(2);
            until("!!document.querySelector('#shop-name-input')");
            tap("#shop-name-input");
            device.executeShellCommand("input text Native-QA");
            until("document.querySelector('#shop-name-input').value==='Native-QA'");
            screenshot("native-keyboard");
            device.pressBack();
            until("!!document.querySelector('.live-score')");
            tap(".live-score button");
            until("!!document.querySelector('.review-card')");
            screenshot("native-list-dark");
            for (int i : new int[] {3, 0, 1, 3, 2, 0, 3}) nav(i);
            until("!!document.querySelector('[data-stat=average]')");
            assertEquals("7.3", js("document.querySelector('[data-stat=average]').textContent"));
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
            nav(2);
            screenshot("native-form");
            JSONObject circle = new JSONObject((String)js("JSON.stringify((()=>{const r=document.querySelector('.dial-mini').getBoundingClientRect();return {width:r.width,height:r.height}})())"));
            assertEquals(circle.getDouble("width"), circle.getDouble("height"), 1);
            device.pressBack();
            until("!!document.querySelector('.review-card')");
            assertFalse((Boolean)js("!!document.querySelector('[role=dialog]')"));
            device.executeShellCommand("settings put system font_scale 1.3");
            Thread.sleep(1000);
            scenario.onActivity(activity -> web = activity.getBridge().getWebView());
            until("!!document.querySelector('.bottom-dock')");
            nav(3);
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
            result.put("score", "7.3");
            result.put("fontScale", "1.3");
            result.put("circle", circle);
            result.put("viewport", js("innerWidth+'x'+innerHeight"));
            result.put("physical120HzVerified", false);
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
