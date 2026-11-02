package com.tuanthaidnc.notfood;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.Rational;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.core.UseCaseGroup;
import androidx.camera.core.ViewPort;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.google.common.util.concurrent.ListenableFuture;
import java.io.File;
import java.util.concurrent.TimeUnit;

/** One square viewport shared by preview and capture; the shutter returns directly to the review. */
public class SquareCameraActivity extends AppCompatActivity {
    private PreviewView preview;
    private ProcessCameraProvider provider;
    private Camera camera;
    private ImageCapture capture;
    private ImageButton shutter;
    private ImageButton flip;
    private ImageButton flash;
    private TextView error;
    private boolean front = false;
    private boolean taking = false;
    private boolean torch = false;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().getDecorView().setBackgroundColor(Color.rgb(14, 17, 13));
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightStatusBars(false);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightNavigationBars(false);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setBackgroundColor(Color.rgb(14, 17, 13));
        setContentView(root);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(bars.left + dp(16), bars.top, bars.right + dp(16), bars.bottom);
            return insets;
        });
        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.addView(button(R.id.camera_close, R.string.camera_close, R.drawable.camera_close, v -> { if (!taking) finish(); }), new LinearLayout.LayoutParams(dp(48), dp(48)));
        TextView title = new TextView(this);
        title.setText(R.string.camera_title);
        title.setTextColor(Color.WHITE);
        title.setTextSize(20);
        // Share the self-hosted TrueType ExtraBold face already bundled for the WebView.
        title.setTypeface(Typeface.createFromAsset(getAssets(), "public/fonts/font-8.woff2"));
        title.setLetterSpacing(-0.04f);
        title.setGravity(Gravity.CENTER);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, dp(64), 1));
        flash = button(R.id.camera_flash, R.string.camera_flash, R.drawable.camera_flash, v -> {
            if (camera != null && camera.getCameraInfo().hasFlashUnit()) {
                torch = !torch;
                camera.getCameraControl().enableTorch(torch);
                flash.setImageTintList(ColorStateList.valueOf(torch ? Color.rgb(218, 255, 56) : Color.WHITE));
            }
        });
        toolbar.addView(flash, new LinearLayout.LayoutParams(dp(48), dp(48)));
        root.addView(toolbar, new LinearLayout.LayoutParams(-1, -2));
        View upper = new View(this);
        root.addView(upper, new LinearLayout.LayoutParams(1, 0, 1));
        FrameLayout square = new FrameLayout(this);
        square.setId(R.id.camera_square);
        square.setBackground(shape(Color.rgb(30, 33, 29), 16));
        square.setClipToOutline(true);
        preview = new PreviewView(this);
        preview.setId(R.id.camera_preview);
        preview.setContentDescription(getString(R.string.camera_viewfinder));
        preview.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        preview.setScaleType(PreviewView.ScaleType.FILL_CENTER);
        square.addView(preview, new FrameLayout.LayoutParams(-1, -1));
        root.addView(square, new LinearLayout.LayoutParams(dp(300), dp(300)));
        root.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> {
            int edge = Math.min(root.getWidth() - root.getPaddingLeft() - root.getPaddingRight(), Math.max(dp(160), root.getHeight() - root.getPaddingTop() - root.getPaddingBottom() - dp(228)));
            if (edge > 0 && square.getLayoutParams().width != edge) {
                square.setLayoutParams(new LinearLayout.LayoutParams(edge, edge));
            }
        });
        preview.setOnTouchListener((v, event) -> {
            if (event.getAction() == android.view.MotionEvent.ACTION_UP) {
                if (camera != null) camera.getCameraControl().startFocusAndMetering(new FocusMeteringAction.Builder(preview.getMeteringPointFactory().createPoint(event.getX(), event.getY())).setAutoCancelDuration(3, TimeUnit.SECONDS).build());
                v.performClick();
            }
            return true;
        });
        error = new TextView(this);
        error.setTextColor(Color.WHITE);
        error.setTextSize(14);
        error.setGravity(Gravity.CENTER);
        error.setVisibility(View.GONE);
        root.addView(error, new LinearLayout.LayoutParams(-1, -2));
        View lower = new View(this);
        root.addView(lower, new LinearLayout.LayoutParams(1, 0, 1));
        LinearLayout controls = new LinearLayout(this);
        controls.setGravity(Gravity.CENTER);
        controls.setPadding(0, dp(16), 0, dp(24));
        View spacer = new View(this);
        controls.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1));
        shutter = button(R.id.camera_shutter, R.string.camera_shutter, R.drawable.camera_shutter, v -> take());
        shutter.setPadding(dp(18), dp(18), dp(18), dp(18));
        shutter.setBackground(shape(Color.rgb(218, 255, 56), 100));
        shutter.setImageTintList(ColorStateList.valueOf(Color.rgb(14, 17, 13)));
        shutter.setEnabled(false);
        controls.addView(shutter, new LinearLayout.LayoutParams(dp(88), dp(88)));
        FrameLayout side = new FrameLayout(this);
        flip = button(R.id.camera_flip, R.string.camera_flip, R.drawable.camera_flip, v -> {
            if (provider != null && !taking) { front = !front; torch = false; bindCamera(); }
        });
        FrameLayout.LayoutParams flipParams = new FrameLayout.LayoutParams(dp(56), dp(56), Gravity.CENTER);
        side.addView(flip, flipParams);
        controls.addView(side, new LinearLayout.LayoutParams(0, dp(88), 1));
        root.addView(controls, new LinearLayout.LayoutParams(-1, -2));
        ListenableFuture<ProcessCameraProvider> future = ProcessCameraProvider.getInstance(this);
        future.addListener(() -> {
            try { provider = future.get(); preview.post(this::bindCamera); }
            catch (Exception e) { showError(); }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindCamera() {
        if (provider == null || isFinishing() || isDestroyed()) return;
        try {
            provider.unbindAll();
            int rotation = preview.getDisplay() == null ? android.view.Surface.ROTATION_0 : preview.getDisplay().getRotation();
            Preview p = new Preview.Builder().setTargetRotation(rotation).build();
            p.setSurfaceProvider(preview.getSurfaceProvider());
            capture = new ImageCapture.Builder().setTargetRotation(rotation).setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY).build();
            ViewPort viewport = new ViewPort.Builder(new Rational(1, 1), rotation).setScaleType(ViewPort.FILL_CENTER).build();
            UseCaseGroup group = new UseCaseGroup.Builder().addUseCase(p).addUseCase(capture).setViewPort(viewport).build();
            CameraSelector selector = front ? CameraSelector.DEFAULT_FRONT_CAMERA : CameraSelector.DEFAULT_BACK_CAMERA;
            camera = provider.bindToLifecycle(this, selector, group);
            shutter.setEnabled(true);
            flash.setEnabled(camera.getCameraInfo().hasFlashUnit());
            flash.setImageTintList(ColorStateList.valueOf(Color.WHITE));
            flip.setEnabled(provider.hasCamera(front ? CameraSelector.DEFAULT_BACK_CAMERA : CameraSelector.DEFAULT_FRONT_CAMERA));
            error.setVisibility(View.GONE);
        } catch (Exception e) { showError(); }
    }

    private void take() {
        if (capture == null || taking) return;
        taking = true;
        shutter.setEnabled(false);
        flip.setEnabled(false);
        try {
            File directory = new File(getCacheDir(), "not-square-captures");
            if (!directory.exists() && !directory.mkdirs()) throw new java.io.IOException();
            File[] older = directory.listFiles();
            if (older != null) for (File old : older) {
                if (System.currentTimeMillis() - old.lastModified() > TimeUnit.DAYS.toMillis(7)) {
                    if (!old.delete()) android.util.Log.w("NotCamera", "Expired capture retained");
                }
            }
            File photo = File.createTempFile("capture-", ".jpg", directory);
            ImageCapture.Metadata metadata = new ImageCapture.Metadata();
            metadata.setReversedHorizontal(front);
            capture.takePicture(new ImageCapture.OutputFileOptions.Builder(photo).setMetadata(metadata).build(), ContextCompat.getMainExecutor(this), new ImageCapture.OnImageSavedCallback() {
                @Override public void onImageSaved(@NonNull ImageCapture.OutputFileResults result) {
                    Intent data = new Intent();
                    data.putExtra("uri", android.net.Uri.fromFile(photo).toString());
                    setResult(RESULT_OK, data);
                    finish();
                }
                @Override public void onError(@NonNull ImageCaptureException exception) {
                    if (!photo.delete()) android.util.Log.w("NotCamera", "Incomplete capture retained");
                    taking = false;
                    shutter.setEnabled(true);
                    flip.setEnabled(true);
                    showError();
                }
            });
        } catch (Exception e) { taking = false; shutter.setEnabled(true); showError(); }
    }

    private void showError() { error.setText(R.string.camera_error); error.setVisibility(View.VISIBLE); }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private GradientDrawable shape(int color, int radius) {
        GradientDrawable drawable = new GradientDrawable(); drawable.setColor(color); drawable.setCornerRadius(dp(radius)); return drawable;
    }
    private ImageButton button(int id, int description, int icon, View.OnClickListener action) {
        ImageButton button = new ImageButton(this);
        button.setId(id); button.setContentDescription(getString(description)); button.setImageResource(icon);
        button.setImageTintList(ColorStateList.valueOf(Color.WHITE));
        button.setBackgroundResource(android.R.drawable.list_selector_background);
        button.setOnClickListener(action); return button;
    }
    @Override protected void onDestroy() { if (provider != null) provider.unbindAll(); super.onDestroy(); }
}
