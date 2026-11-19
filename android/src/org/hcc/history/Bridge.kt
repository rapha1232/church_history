package org.hcc.history

import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Base64
import android.webkit.JavascriptInterface
import org.json.JSONObject

/** What the page can ask of the app (window.HCCApp). Called on a background thread. */
class Bridge(private val act: MainActivity) {
    private fun prefs() = act.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE)

    @JavascriptInterface fun isApp() = true
    @JavascriptInterface fun splashReady() = act.releaseLaunchScreen()
    @JavascriptInterface fun haptic(kind: String?) = act.haptic(kind == "strong")
    @JavascriptInterface fun appVersion(): String = BuildConfig.VERSION_NAME

    /* ---------- files ---------- */

    private fun create(name: String?, mime: String) {
        val i = Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE, name)
        try { @Suppress("DEPRECATION") act.startActivityForResult(i, MainActivity.REQ_SAVE) } catch (_: Exception) { }
    }

    @JavascriptInterface fun saveFile(name: String?, mime: String?, text: String?) {
        act.pendingText = text; act.pendingBytes = null
        create(name, if (mime.isNullOrEmpty()) "text/plain" else mime)
    }

    @JavascriptInterface fun saveFileB64(name: String?, mime: String?, b64: String?) {
        act.pendingBytes = try { Base64.decode(b64, Base64.DEFAULT) } catch (_: Exception) { return }
        act.pendingText = null
        create(name, if (mime.isNullOrEmpty()) "application/octet-stream" else mime)
    }

    /* ---------- daily notifications ---------- */

    @JavascriptInterface fun setDaily(on: Boolean, h: Int, m: Int) {
        prefs().edit().putBoolean("on", on).putInt("h", h).putInt("m", m).apply()
        if (on) act.askNotify()
        Daily.schedule(act)
    }

    @JavascriptInterface fun getDaily(): String = prefs().let {
        """{"on":${it.getBoolean("on", false)},"h":${it.getInt("h", 8)},"m":${it.getInt("m", 0)},"otd":${it.getBoolean("otd", true)}}"""
    }

    @JavascriptInterface fun setVerseDaily(on: Boolean, h: Int, m: Int) {
        prefs().edit().putBoolean("von", on).putInt("vh", h).putInt("vm", m).apply()
        if (on) act.askNotify()
        Daily.schedule(act)
    }

    @JavascriptInterface fun getVerseDaily(): String = prefs().let {
        """{"on":${it.getBoolean("von", false)},"h":${it.getInt("vh", 7)},"m":${it.getInt("vm", 0)}}"""
    }

    @JavascriptInterface fun setOtd(on: Boolean) = prefs().edit().putBoolean("otd", on).apply()

    /* ---------- what the widgets show ---------- */

    @JavascriptInterface fun setPlanNote(note: String?) { prefs().edit().putString("plan", note ?: "").apply(); Widgets.all(act) }
    @JavascriptInterface fun setBiblePlan(note: String?) { prefs().edit().putString("bplan", note ?: "").apply(); Widgets.all(act) }
    @JavascriptInterface fun setProgress(title: String?, sub: String?, hash: String?) {
        prefs().edit().putString("pt", title ?: "").putString("ps", sub ?: "").putString("ph", hash ?: "home").apply()
        Widgets.all(act)
    }

    /* ---------- widgets ---------- */

    @JavascriptInterface fun openWidgets() = act.startActivity(Intent(act, WidgetConfig::class.java))
    @JavascriptInterface fun canPinWidgets() = Widgets.canPin(act)
    @JavascriptInterface fun pinWidget(key: String?) = Widgets.pin(act, Widgets.kindByKey(key))
    @JavascriptInterface fun widgetCount() = Widgets.placed(act).size

    /* ---------- study packs ---------- */

    @JavascriptInterface fun packsStatus(): String = act.packs.status()

    @JavascriptInterface fun packDownload(name: String) {
        Thread {
            act.packs.downloadAll(name) { done, total, failed ->
                act.js("HCCPackProgress", JSONObject().put("pack", name).put("done", done).put("total", total).put("failed", failed).toString())
            }
        }.start()
    }

    @JavascriptInterface fun packRemove(name: String) = act.packs.remove(name)

    /* ---------- backup of reading progress (kept by Android backup too) ---------- */

    @JavascriptInterface fun backupPut(json: String?) { if (json != null && json.length < 4_000_000) Backup.put(act, json) }
    @JavascriptInterface fun backupGet(): String = Backup.get(act)
    @JavascriptInterface fun backupTime(): Long = Backup.time(act)

    /* ---------- language and updates ---------- */

    @JavascriptInterface fun setLanguage(tag: String?) = Lang.set(act, tag ?: "")
    @JavascriptInterface fun getLanguage(): String = Lang.get(act)

    @JavascriptInterface fun checkUpdate() = Updater.checkNow(act)
    @JavascriptInterface fun autoUpdate(): Boolean = Updater.enabled(act)
    @JavascriptInterface fun setAutoUpdate(on: Boolean) = Updater.setEnabled(act, on)
    @JavascriptInterface fun canSelfUpdate(): Boolean = Updater.selfManaged(act)
    @JavascriptInterface fun sdk(): Int = Build.VERSION.SDK_INT
}
