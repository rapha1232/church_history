package org.hcc.history

import android.app.Activity
import android.app.AlertDialog
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.ProgressBar
import android.widget.Toast
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Free updates without an app store: the app looks at the latest GitHub release, and if it is newer offers to
 * download its APK and hand it to Android's installer. Skipped when an app store installed the app (it updates it).
 */
object Updater {
    private const val P = "updater"
    private val STORES = setOf("com.android.vending", "com.sec.android.app.samsungapps", "org.fdroid.fdroid", "org.fdroid.basic",
        "com.looker.droidify", "com.aurora.store", "com.huawei.appmarket", "com.amazon.venezia", "dev.imranr.obtainium",
        "dev.imranr.obtainium.fdroid", "com.machiav3lli.fdroid", "in.sunilpaulmathew.izzyondroid")

    data class Release(val tag: String, val name: String, val code: Int, val apk: String, val notes: String)

    /** "v19", "19.1", "v19.1.0" -> 1900, 1901: the same rule as the release workflow. */
    fun codeOf(tag: String): Int {
        val p = tag.trim().removePrefix("v").removePrefix("V").split('.')
        val major = p.getOrNull(0)?.toIntOrNull() ?: return -1
        val minor = p.getOrNull(1)?.toIntOrNull() ?: 0
        return major * 100 + minor
    }

    private fun installer(c: Context): String? = try {
        if (Build.VERSION.SDK_INT >= 30) c.packageManager.getInstallSourceInfo(c.packageName).installingPackageName
        else @Suppress("DEPRECATION") c.packageManager.getInstallerPackageName(c.packageName)
    } catch (_: Exception) { null }

    fun selfManaged(c: Context) = installer(c) !in STORES
    fun enabled(c: Context) = c.getSharedPreferences(P, 0).getBoolean("on", true)
    fun setEnabled(c: Context, on: Boolean) = c.getSharedPreferences(P, 0).edit().putBoolean("on", on).apply()

    fun latest(): Release? = try {
        val con = URL(BuildConfig.RELEASES_API).openConnection() as HttpURLConnection
        con.setRequestProperty("Accept", "application/vnd.github+json")
        con.connectTimeout = 10000; con.readTimeout = 15000
        if (con.responseCode != 200) null else {
            val o = JSONObject(con.inputStream.bufferedReader().readText())
            val assets = o.optJSONArray("assets")
            var apk = ""
            for (i in 0 until (assets?.length() ?: 0)) {
                val a = assets!!.getJSONObject(i)
                if (a.optString("name").endsWith(".apk")) { apk = a.optString("browser_download_url"); break }
            }
            val tag = o.optString("tag_name")
            Release(tag, o.optString("name", tag), codeOf(tag), apk, o.optString("body"))
        }
    } catch (_: Exception) { null }

    private fun newer(r: Release?) = r != null && r.apk.isNotEmpty() && r.code > BuildConfig.VERSION_CODE

    /** On app start, at most twice a day. */
    fun checkOnStart(a: Activity) {
        if (!enabled(a) || !selfManaged(a)) return
        val p = a.getSharedPreferences(P, 0)
        if (System.currentTimeMillis() - p.getLong("last", 0) < 12 * 3600_000L) return
        p.edit().putLong("last", System.currentTimeMillis()).apply()
        Thread {
            val r = latest()
            if (newer(r) && p.getString("skip", "") != r!!.tag) a.runOnUiThread { offer(a, r, true) }
        }.start()
    }

    /** From Settings: always answers. */
    fun checkNow(a: Activity) {
        Thread {
            val r = latest()
            a.runOnUiThread {
                when {
                    r == null -> Toast.makeText(a, a.getString(R.string.upd_offline), Toast.LENGTH_LONG).show()
                    !newer(r) -> Toast.makeText(a, a.getString(R.string.upd_latest, BuildConfig.VERSION_NAME), Toast.LENGTH_LONG).show()
                    !selfManaged(a) -> Toast.makeText(a, a.getString(R.string.upd_store), Toast.LENGTH_LONG).show()
                    else -> offer(a, r!!, false)
                }
            }
        }.start()
    }

    /** From the midnight alarm: a notification when an update is out (the app may not be opened for days). */
    @JvmStatic
    fun checkInBackground(c: Context, res: BroadcastReceiver.PendingResult?) {
        if (!enabled(c) || !selfManaged(c)) { res?.finish(); return }
        val p = c.getSharedPreferences(P, 0)
        if (System.currentTimeMillis() - p.getLong("bg", 0) < 20 * 3600_000L) { res?.finish(); return }
        p.edit().putLong("bg", System.currentTimeMillis()).apply()
        Thread {
            try {
                val r = latest()
                if (newer(r) && p.getString("told", "") != r!!.tag) {
                    p.edit().putString("told", r.tag).apply()
                    val nm = c.getSystemService(NotificationManager::class.java)
                    if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel("update") == null)
                        nm.createNotificationChannel(NotificationChannel("update", c.getString(R.string.upd_channel), NotificationManager.IMPORTANCE_LOW))
                    @Suppress("DEPRECATION")
                    val b = if (Build.VERSION.SDK_INT >= 26) android.app.Notification.Builder(c, "update") else android.app.Notification.Builder(c)
                    b.setSmallIcon(R.drawable.ic_stat).setContentTitle(c.getString(R.string.upd_title, r.name))
                        .setContentText(c.getString(R.string.upd_tap))
                        .setContentIntent(Widgets.open(c, "home", 31)).setAutoCancel(true).setColor(0xFFA3341D.toInt())
                    try { nm.notify(9, b.build()) } catch (_: SecurityException) { }
                }
            } finally { try { res?.finish() } catch (_: Exception) { } }
        }.start()
    }

    private fun offer(a: Activity, r: Release, auto: Boolean) {
        if (a.isFinishing || a.isDestroyed) return
        val notes = r.notes.lines().filter { it.isNotBlank() }.take(8).joinToString("\n").take(600)
        val d = AlertDialog.Builder(a)
            .setTitle(a.getString(R.string.upd_title, r.name))
            .setMessage(a.getString(R.string.upd_body, BuildConfig.VERSION_NAME) + if (notes.isNotEmpty()) "\n\n$notes" else "")
            .setPositiveButton(R.string.upd_install) { _, _ -> download(a, r) }
            .setNegativeButton(R.string.upd_later, null)
        if (auto) d.setNeutralButton(R.string.upd_skip) { _, _ -> a.getSharedPreferences(P, 0).edit().putString("skip", r.tag).apply() }
        d.show()
    }

    private fun download(a: Activity, r: Release) {
        if (Build.VERSION.SDK_INT >= 26 && !a.packageManager.canRequestPackageInstalls()) {
            Toast.makeText(a, a.getString(R.string.upd_allow), Toast.LENGTH_LONG).show()
            try { a.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + a.packageName))) } catch (_: Exception) { }
            return
        }
        val bar = ProgressBar(a, null, android.R.attr.progressBarStyleHorizontal).apply { isIndeterminate = true; setPadding(48, 24, 48, 24) }
        val dlg = AlertDialog.Builder(a).setTitle(R.string.upd_downloading).setView(bar).setCancelable(false).show()
        Thread {
            val f = File(a.cacheDir, "update.apk")
            val ok = try {
                val con = URL(r.apk).openConnection() as HttpURLConnection
                con.instanceFollowRedirects = true; con.connectTimeout = 15000; con.readTimeout = 60000
                val len = con.contentLengthLong
                con.inputStream.use { inp ->
                    f.outputStream().use { out ->
                        val buf = ByteArray(65536); var n: Int; var got = 0L
                        while (inp.read(buf).also { n = it } > 0) {
                            out.write(buf, 0, n); got += n
                            if (len > 0) a.runOnUiThread { bar.isIndeterminate = false; bar.max = 1000; bar.progress = (got * 1000 / len).toInt() }
                        }
                    }
                }
                f.length() > 0
            } catch (_: Exception) { false }
            a.runOnUiThread {
                dlg.dismiss()
                if (ok) install(a, f) else Toast.makeText(a, a.getString(R.string.upd_failed), Toast.LENGTH_LONG).show()
            }
        }.start()
    }

    private fun install(c: Context, apk: File) {
        try {
            val pi = c.packageManager.packageInstaller
            val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
            params.setAppPackageName(c.packageName)
            val id = pi.createSession(params)
            pi.openSession(id).use { s ->
                s.openWrite("app.apk", 0, apk.length()).use { out -> apk.inputStream().use { it.copyTo(out) }; s.fsync(out) }
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0)
                val cb = PendingIntent.getBroadcast(c, 77, Intent(c, UpdateReceiver::class.java), flags)
                s.commit(cb.intentSender)
            }
        } catch (_: Exception) {
            Toast.makeText(c, c.getString(R.string.upd_failed), Toast.LENGTH_LONG).show()
        }
    }
}

/** Android's answer to the install: show its confirmation screen, or explain a failure. */
class UpdateReceiver : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        when (i.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                @Suppress("DEPRECATION")
                val confirm = if (Build.VERSION.SDK_INT >= 33) i.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java) else i.getParcelableExtra(Intent.EXTRA_INTENT)
                confirm?.let { c.startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
            }
            PackageInstaller.STATUS_SUCCESS -> { }
            PackageInstaller.STATUS_FAILURE_CONFLICT, PackageInstaller.STATUS_FAILURE_INCOMPATIBLE ->
                Toast.makeText(c, c.getString(R.string.upd_key), Toast.LENGTH_LONG).show()
            PackageInstaller.STATUS_FAILURE_ABORTED -> { }
            else -> Toast.makeText(c, c.getString(R.string.upd_failed), Toast.LENGTH_LONG).show()
        }
    }
}
