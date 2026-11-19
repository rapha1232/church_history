package org.hcc.history

import android.app.backup.BackupManager
import android.content.Context
import java.io.File

/**
 * A copy of the reader's progress (bookmarks, notes, plans, read chapters, settings) outside the WebView, written by the page.
 * Android's backup keeps this file (see res/xml/backup_rules.xml), so a new phone or a reinstall gets it back,
 * and the page restores from it when its own storage is empty.
 */
object Backup {
    private fun file(c: Context) = File(c.filesDir, "backup.json")

    fun put(c: Context, json: String) {
        val f = file(c); val tmp = File(f.path + ".tmp")
        try {
            tmp.writeText(json)
            if (tmp.renameTo(f)) BackupManager(c).dataChanged()
        } catch (_: Exception) { tmp.delete() }
    }

    fun get(c: Context): String = try { file(c).takeIf { it.isFile }?.readText() ?: "" } catch (_: Exception) { "" }
    fun time(c: Context): Long = file(c).lastModified()
}
