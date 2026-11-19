package org.hcc.history;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.view.HapticFeedbackConstants;
import android.webkit.JavascriptInterface;

class Bridge {
    final MainActivity act;
    Bridge(MainActivity a) { act = a; }

    @JavascriptInterface
    public void haptic(String kind) {
        int k = "strong".equals(kind) ? HapticFeedbackConstants.LONG_PRESS : HapticFeedbackConstants.KEYBOARD_TAP;
        act.runOnUiThread(new HapticTask(act, k));
    }

    @JavascriptInterface
    public void saveFile(String name, String mime, String text) {
        act.pendingText = text; act.pendingBytes = null;
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(mime == null || mime.length() == 0 ? "text/plain" : mime);
        i.putExtra(Intent.EXTRA_TITLE, name);
        try { act.startActivityForResult(i, MainActivity.REQ_SAVE); } catch (Exception e) { }
    }

    @JavascriptInterface
    public void setDaily(boolean on, int h, int m) {
        SharedPreferences p = act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE);
        p.edit().putBoolean("on", on).putInt("h", h).putInt("m", m).apply();
        if (on && Build.VERSION.SDK_INT >= 33) act.askNotify();
        Daily.schedule(act);
    }

    @JavascriptInterface
    public String getDaily() {
        SharedPreferences p = act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE);
        return "{\"on\":" + p.getBoolean("on", false) + ",\"h\":" + p.getInt("h", 8) + ",\"m\":" + p.getInt("m", 0) + ",\"otd\":" + p.getBoolean("otd", true) + "}";
    }

    @JavascriptInterface
    public void saveFileB64(String name, String mime, String b64) {
        try { act.pendingBytes = android.util.Base64.decode(b64, android.util.Base64.DEFAULT); } catch (Exception e) { return; }
        act.pendingText = null;
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(mime == null || mime.length() == 0 ? "application/octet-stream" : mime);
        i.putExtra(Intent.EXTRA_TITLE, name);
        try { act.startActivityForResult(i, MainActivity.REQ_SAVE); } catch (Exception e) { }
    }

    @JavascriptInterface
    public void setPlanNote(String note) {
        act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE).edit().putString("plan", note == null ? "" : note).apply();
        Widgets.all(act);
    }

    @JavascriptInterface
    public void setOtd(boolean on) {
        act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE).edit().putBoolean("otd", on).apply();
    }

    @JavascriptInterface
    public void setProgress(String title, String sub, String hash) {
        act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE).edit().putString("pt", title == null ? "" : title)
            .putString("ps", sub == null ? "" : sub).putString("ph", hash == null ? "home" : hash).apply();
        Widgets.all(act);
    }

    @JavascriptInterface
    public void setBiblePlan(String note) {
        act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE).edit().putString("bplan", note == null ? "" : note).apply();
        Widgets.all(act);
    }

    @JavascriptInterface
    public void setVerseDaily(boolean on, int h, int m) {
        act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE).edit().putBoolean("von", on).putInt("vh", h).putInt("vm", m).apply();
        if (on && Build.VERSION.SDK_INT >= 33) act.askNotify();
        Daily.schedule(act);
    }

    @JavascriptInterface
    public String getVerseDaily() {
        SharedPreferences p = act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE);
        return "{\"on\":" + p.getBoolean("von", false) + ",\"h\":" + p.getInt("vh", 7) + ",\"m\":" + p.getInt("vm", 0) + "}";
    }

    @JavascriptInterface
    public boolean isApp() { return true; }

    /* ---------- widgets ---------- */

    @JavascriptInterface
    public void openWidgets() {
        act.startActivity(new Intent(act, WidgetConfig.class));
    }

    @JavascriptInterface
    public boolean canPinWidgets() { return Widgets.canPin(act); }

    @JavascriptInterface
    public boolean pinWidget(String key) { return Widgets.pin(act, Widgets.kindByKey(key)); }

    @JavascriptInterface
    public int widgetCount() { return Widgets.placed(act).size(); }
}
