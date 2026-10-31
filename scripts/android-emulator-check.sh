#!/usr/bin/env bash
# Collect while the runner's emulator is still alive. The action shuts it down
# before the next workflow step; invoking adb there otherwise waits indefinitely.
set -u
mkdir -p /tmp/not-android/qa
adb logcat -c
./android/gradlew -p android :app:connectedDebugAndroidTest --no-daemon
test_status=$?
timeout 15s adb pull /sdcard/Download/not-ci-qa /tmp/not-android/qa || true
timeout 10s adb logcat -d > /tmp/not-android/logcat.txt || true
if [ "$test_status" -eq 0 ] && [ ! -s /tmp/not-android/qa/native-results.json ]; then
  echo 'Native checks completed without the expected proof file.' >&2
  test_status=1
fi
exit "$test_status"
