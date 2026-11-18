package org.hcc.history;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

@SuppressWarnings("rawtypes")
class Back implements ValueCallback {
        final MainActivity act;
        Back(MainActivity a) { act = a; }
        @Override
        public void onReceiveValue(Object o) {
        String v = o == null ? null : o.toString();
            if (v != null && v.contains("h")) return;
            if (act.web.canGoBack()) act.web.goBack(); else act.finish();
        }
    }

