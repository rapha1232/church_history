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

class Client extends WebViewClient {
        final MainActivity act;
        Client(MainActivity a) { act = a; }
        @Override
        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
            return act.openExternal(req.getUrl());
        }
    }

