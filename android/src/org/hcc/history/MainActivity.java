package org.hcc.history;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import java.io.OutputStream;

@SuppressWarnings("unchecked")
public class MainActivity extends Activity {
    static final int REQ_SAVE = 41;
    WebView web;
    String pendingText;
    byte[] pendingBytes;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0B0C10);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        web.setHapticFeedbackEnabled(true);
        web.setWebViewClient(new Client(this));
        web.addJavascriptInterface(new Bridge(this), "HCCApp");
        setContentView(web);
        String h = hashOf(getIntent());
        if (state != null && h == null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html" + (h != null ? "#" + h : ""));
        Daily.schedule(this);
    }

    static String hashOf(Intent i) {
        if (i == null) return null;
        String h = i.getStringExtra("hash");
        if (h == null || !h.matches("[A-Za-z0-9~_-]{1,80}")) return null;
        return h;
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        setIntent(i);
        String h = hashOf(i);
        if (h != null && web != null) web.evaluateJavascript("location.hash='" + h + "'", null);
    }

    void askNotify() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != 0)
            runOnUiThread(new AskTask(this));
    }

    boolean openExternal(Uri u) {
        if ("file".equals(u.getScheme())) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
        return true;
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_SAVE && res == RESULT_OK && data != null && data.getData() != null && (pendingText != null || pendingBytes != null)) {
            try {
                OutputStream o = getContentResolver().openOutputStream(data.getData());
                o.write(pendingBytes != null ? pendingBytes : pendingText.getBytes("UTF-8")); o.close();
                android.widget.Toast.makeText(this, "Saved", android.widget.Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                android.widget.Toast.makeText(this, "Could not save the file", android.widget.Toast.LENGTH_SHORT).show();
            }
        }
        pendingText = null; pendingBytes = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript(
            "(function(){function c(s){var e=document.querySelector(s);if(e){e.click();return true}return false}" +
            "if(window.HCCSourcesOpen&&HCCSourcesOpen()){HCCSourcesClose();return 'h';}" +
            "var ob=document.querySelector('.onb');if(ob){var sk=ob.querySelector('[data-ob]');if(sk)sk.click();return 'h';}" +
            "if(window.HCCBiblePickOpen&&HCCBiblePickOpen()){HCCBiblePickClose();return 'h';}" +
            "if(window.HCCBibleSheetOpen&&HCCBibleSheetOpen()){HCCBibleSheetClose();return 'h';}" +
            "var lb=document.getElementById('lb');if(lb&&!lb.hidden){c('#lbClose');return 'h';}" +
            "var b=document.querySelector('.bio');if(b&&!b.hidden){c('.bio-x');return 'h';}" +
            "var np=document.querySelector('.notepop');if(np&&!np.hidden){np.hidden=true;return 'h';}" +
            "var r=document.getElementById('reader');if(r&&!r.hidden){c('#rclose');return 'h';}" +
            "if(document.body.classList.contains('navopen')){document.body.classList.remove('navopen');return 'h';}" +
            "if(location.hash&&location.hash!=='#home'&&history.length<2){location.hash='home';return 'h';}return '';})()",
            (android.webkit.ValueCallback<String>) (android.webkit.ValueCallback) new Back(this));
    }
}
