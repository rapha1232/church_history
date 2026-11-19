package org.hcc.history

import android.app.LocaleManager
import android.content.Context
import android.os.Build
import android.content.res.Configuration
import android.os.LocaleList
import java.util.Locale

/** The app's language. From Android 13 it is the per-app language (also in system settings); the page keeps its own copy. */
object Lang {
    val SUPPORTED = listOf("en", "es", "pt", "fr", "ar")

    fun set(c: Context, tag: String) {
        val t = tag.takeIf { it in SUPPORTED } ?: ""
        c.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE).edit().putString("lang", t).apply()
        if (Build.VERSION.SDK_INT >= 33) {
            val lm = c.getSystemService(LocaleManager::class.java)
            val want = if (t.isEmpty()) LocaleList.getEmptyLocaleList() else LocaleList.forLanguageTags(t)
            if (lm != null && lm.applicationLocales != want) lm.applicationLocales = want
        }
        Widgets.all(c)
    }

    fun get(c: Context): String {
        if (Build.VERSION.SDK_INT >= 33) {
            val l = c.getSystemService(LocaleManager::class.java)?.applicationLocales
            if (l != null && !l.isEmpty) return l[0].language
        }
        return c.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE).getString("lang", "") ?: ""
    }

    /** Below Android 13 there is no per-app language: resources for the widgets and notifications come from this context. */
    @JvmStatic
    fun wrap(c: Context): Context {
        if (Build.VERSION.SDK_INT >= 33) return c
        val t = c.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE).getString("lang", "") ?: ""
        if (t.isEmpty()) return c
        val cfg = Configuration(c.resources.configuration)
        cfg.setLocale(Locale.forLanguageTag(t))
        return c.createConfigurationContext(cfg)
    }
}
