#!/usr/bin/env bash
# Collect while the runner's emulator is still alive. The action shuts it down
# before the next workflow step; invoking adb there otherwise waits indefinitely.
set -u
mkdir -p /tmp/not-android/qa
adb logcat -c
./android/gradlew -p android :app:connectedDebugAndroidTest --no-daemon
test_status=$?
timeout 15s adb pull /sdcard/Android/data/com.tuanthaidnc.notfood/files/qa /tmp/not-android/ || true
timeout 10s adb logcat -d > /tmp/not-android/logcat.txt || true
exit "$test_status"
