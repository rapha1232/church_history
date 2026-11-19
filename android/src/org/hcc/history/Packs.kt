package org.hcc.history

import android.content.Context
import android.webkit.WebResourceResponse
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap

/**
 * Optional study data (word-by-word Greek and Hebrew, lexicons, the Greek Bible, the Vulgate) is left out of the APK
 * to keep it small. Each file is downloaded from the web app the first time the page asks for it and kept for good;
 * Settings can also download a whole pack ahead of time for offline use, or remove it.
 */
class Packs(private val c: Context) {
    private val dir = File(c.filesDir, "packs")
    /** pack name -> list of (path, size) */
    val index: Map<String, List<Pair<String, Long>>>
    private val owner = HashMap<String, String>()
    private val locks = ConcurrentHashMap<String, Any>()

    init {
        val m = LinkedHashMap<String, List<Pair<String, Long>>>()
        try {
            val o = JSONObject(Widgets.asset(c, "packs.json"))
            for (name in o.keys()) {
                val a = o.getJSONArray(name)
                m[name] = (0 until a.length()).map { val r = a.getJSONArray(it); r.getString(0) to r.getLong(1) }
                m[name]!!.forEach { owner[it.first] = name }
            }
        } catch (_: Exception) { }
        index = m
    }

    fun owns(path: String) = owner.containsKey(path)
    private fun file(path: String) = File(dir, path)
    fun have(path: String) = file(path).let { it.isFile && it.length() > 0 }

    /** Download one file (once, even if the page asks for it twice at the same time). */
    fun fetch(path: String): File? {
        val lock = locks.getOrPut(path) { Any() }
        synchronized(lock) {
            if (have(path)) return file(path)
            val out = file(path); out.parentFile?.mkdirs()
            val tmp = File(out.path + ".part")
            return try {
                val con = URL(BuildConfig.PACK_BASE + path).openConnection() as HttpURLConnection
                con.connectTimeout = 15000; con.readTimeout = 60000
                if (con.responseCode != 200) { con.disconnect(); return null }
                con.inputStream.use { inp -> tmp.outputStream().use { inp.copyTo(it) } }
                con.disconnect()
                if (tmp.length() == 0L || !tmp.renameTo(out)) { tmp.delete(); null } else out
            } catch (_: Exception) { tmp.delete(); null }
        }
    }

    fun response(path: String): WebResourceResponse {
        val f = if (have(path)) file(path) else fetch(path)
        return if (f != null) WebResourceResponse(mime(path), "utf-8", FileInputStream(f))
        else WebResourceResponse("text/plain", "utf-8", 404, "Not available offline", emptyMap(), ByteArrayInputStream(ByteArray(0)))
    }

    private fun mime(p: String) = when {
        p.endsWith(".js") -> "application/javascript"
        p.endsWith(".json") -> "application/json"
        p.endsWith(".webp") -> "image/webp"
        else -> "application/octet-stream"
    }

    /** {"study":{"mb":38.5,"files":40,"have":3}, ...} */
    fun status(): String {
        val o = JSONObject()
        for ((name, files) in index) {
            o.put(name, JSONObject().put("mb", Math.round(files.sumOf { it.second } / 1e5) / 10.0)
                .put("files", files.size).put("have", files.count { have(it.first) }))
        }
        return o.toString()
    }

    /** Download every file of a pack, reporting progress as (done, total, failed). */
    fun downloadAll(name: String, progress: (Int, Int, Int) -> Unit) {
        val files = index[name] ?: return progress(0, 0, 0)
        var done = 0; var failed = 0
        for ((p, _) in files) {
            if (!have(p) && fetch(p) == null) failed++
            done++
            progress(done, files.size, failed)
        }
    }

    fun remove(name: String) {
        index[name]?.forEach { file(it.first).delete() }
    }

    fun packsJson(): String = JSONArray(index.keys.toList()).toString()
}
