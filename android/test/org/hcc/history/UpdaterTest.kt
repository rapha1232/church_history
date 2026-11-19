package org.hcc.history

import org.junit.Assert.assertEquals
import org.junit.Test

class UpdaterTest {
    @Test fun tagsBecomeVersionCodes() {
        assertEquals(1800, Updater.codeOf("v18"))
        assertEquals(1801, Updater.codeOf("v18.1"))
        assertEquals(1900, Updater.codeOf("19"))
        assertEquals(1912, Updater.codeOf("V19.12.3"))
        assertEquals(-1, Updater.codeOf("latest"))
    }

    @Test fun newerTagsSortHigher() {
        assert(Updater.codeOf("v19.1") > Updater.codeOf("v19"))
        assert(Updater.codeOf("v20") > Updater.codeOf("v19.9"))
    }
}
