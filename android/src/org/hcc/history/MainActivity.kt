package org.hcc.history

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.HapticFeedbackConstants
import android.view.WindowInsets
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.Toast
import android.window.OnBackInvokedDispatcher

/** The app: one WebView showing the bundled site, with a bridge for notifications, widgets, files, packs and backups. */
class MainActivity : Activity() {
    companion object {
        const val REQ_SAVE = 41
        const val REQ_OPEN = 42
        const val REQ_NOTIFY = 7
        private val HASH = Regex("[A-Za-z0-9~_-]{1,80}")
        fun hashOf(i: Intent?): String? = i?.getStringExtra("hash")?.takeIf { HASH.matches(it) }
    }

    lateinit var web: WebView
    lateinit var packs: Packs
    var pendingText: String? = null
    var pendingBytes: ByteArray? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        packs = Packs(applicationContext)
        web = WebView(this).apply {
            setBackgroundColor(0xFF0B0C10.toInt())
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.textZoom = 100
            isHapticFeedbackEnabled = true
            webViewClient = Client(this@MainActivity)
            webChromeClient = Chrome()
            addJavascriptInterface(Bridge(this@MainActivity), "HCCApp")
        }
        val root = FrameLayout(this).apply { setBackgroundColor(0xFF0B0C10.toInt()); addView(web) }
        setContentView(root)
        edgeToEdge(root)
        backHandling()
        val h = hashOf(intent)
        if (state != null && h == null) web.restoreState(state)
        else web.loadUrl("file:///android_asset/index.html" + (if (h != null) "#$h" else ""))
        Daily.schedule(this)
        Updater.checkOnStart(this)
    }

    /** From Android 15 the app draws behind the status and navigation bars: keep the page clear of them and of the keyboard. */
    private fun edgeToEdge(root: FrameLayout) {
        if (Build.VERSION.SDK_INT < 35) return   // older versions lay the page out between the bars themselves
        root.setOnApplyWindowInsetsListener { v, ins ->
            val bars = ins.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            val ime = ins.getInsets(WindowInsets.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
            WindowInsets.CONSUMED
        }
    }

    /** Back closes what is open in the page first (sheets, the reader, menus), then leaves. */
    private fun backHandling() {
        if (Build.VERSION.SDK_INT >= 33)
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { goBack() }
    }

    @Deprecated("Android 12 and older")
    override fun onBackPressed() = goBack()

    private fun goBack() {
        web.evaluateJavascript(BACK_JS) { v ->
            if (v != null && v.contains("h")) return@evaluateJavascript
            if (web.canGoBack()) web.goBack() else finish()
        }
    }

    override fun onNewIntent(i: Intent) {
        super.onNewIntent(i)
        setIntent(i)
        hashOf(i)?.let { web.evaluateJavascript("location.hash='$it'", null) }
    }

    fun askNotify() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != 0)
            runOnUiThread { requestPermissions(arrayOf("android.permission.POST_NOTIFICATIONS"), REQ_NOTIFY) }
    }

    fun haptic(strong: Boolean) = runOnUiThread {
        web.performHapticFeedback(if (strong) HapticFeedbackConstants.LONG_PRESS else HapticFeedbackConstants.KEYBOARD_TAP)
    }

    fun openExternal(u: Uri): Boolean {
        if (u.scheme == "file") return false
        try { startActivity(Intent(Intent.ACTION_VIEW, u)) } catch (_: Exception) { }
        return true
    }

    /** Call a function in the page with a JSON argument (from any thread). */
    fun js(fn: String, json: String) = runOnUiThread {
        web.evaluateJavascript("window.$fn&&window.$fn($json)", null)
    }

    /** <input type="file"> in the page: lets the reader pick a backup or a Bible edition to import. */
    inner class Chrome : WebChromeClient() {
        override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
            fileCallback?.onReceiveValue(null)
            fileCallback = cb
            val i = Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
            return try { startActivityForResult(i, REQ_OPEN); true } catch (_: Exception) { fileCallback = null; false }
        }
    }

    @Deprecated("startActivityForResult is enough for a single WebView activity")
    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req, res, data)
        if (req == REQ_OPEN) {
            fileCallback?.onReceiveValue(if (res == RESULT_OK && data?.data != null) arrayOf(data.data!!) else null)
            fileCallback = null
            return
        }
        if (req == REQ_SAVE && res == RESULT_OK && data?.data != null && (pendingText != null || pendingBytes != null)) {
            try {
                contentResolver.openOutputStream(data.data!!)!!.use { it.write(pendingBytes ?: pendingText!!.toByteArray()) }
                Toast.makeText(this, getString(R.string.saved), Toast.LENGTH_SHORT).show()
            } catch (_: Exception) {
                Toast.makeText(this, getString(R.string.save_failed), Toast.LENGTH_SHORT).show()
            }
        }
        pendingText = null; pendingBytes = null
    }

    override fun onSaveInstanceState(out: Bundle) {
        super.onSaveInstanceState(out)
        web.saveState(out)
    }
}

private const val BACK_JS = "(function(){function c(s){var e=document.querySelector(s);if(e){e.click();return true}return false}" +
    "if(window.HCCSourcesOpen&&HCCSourcesOpen()){HCCSourcesClose();return 'h';}" +
    "var ob=document.querySelector('.onb');if(ob){var sk=ob.querySelector('[data-ob]');if(sk)sk.click();return 'h';}" +
    "if(window.HCCBiblePickOpen&&HCCBiblePickOpen()){HCCBiblePickClose();return 'h';}" +
    "if(window.HCCBibleSheetOpen&&HCCBibleSheetOpen()){HCCBibleSheetClose();return 'h';}" +
    "var lb=document.getElementById('lb');if(lb&&!lb.hidden){c('#lbClose');return 'h';}" +
    "var b=document.querySelector('.bio');if(b&&!b.hidden){c('.bio-x');return 'h';}" +
    "var np=document.querySelector('.notepop');if(np&&!np.hidden){np.hidden=true;return 'h';}" +
    "var r=document.getElementById('reader');if(r&&!r.hidden){c('#rclose');return 'h';}" +
    "if(document.body.classList.contains('navopen')){document.body.classList.remove('navopen');return 'h';}" +
    "if(location.hash&&location.hash!=='#home'&&history.length<2){location.hash='home';return 'h';}return '';})()"
