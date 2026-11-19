package org.hcc.history

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient

class Client(private val act: MainActivity) : WebViewClient() {
    override fun shouldOverrideUrlLoading(v: WebView, req: WebResourceRequest): Boolean = act.openExternal(req.url)

    /** Study-pack files are not in the APK: serve them from storage, downloading them the first time. */
    override fun shouldInterceptRequest(v: WebView, req: WebResourceRequest): WebResourceResponse? {
        val u = req.url
        if (u.scheme != "file") return null
        val path = u.path?.removePrefix("/android_asset/") ?: return null
        return if (act.packs.owns(path)) act.packs.response(path) else null
    }
}
