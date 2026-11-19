package org.hcc.history

import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Test

class WidgetsTest {
    private val cal = JSONArray("""[[1,1,379,"a"],[3,7,null,"b"],[5,20,325,"c"],[12,25,null,"d"]]""")

    @Test fun sameDayEntryIsFirst() = assertEquals(2, Widgets.otdStart(cal, 5, 20))
    @Test fun otherwiseTheNextOne() = assertEquals(3, Widgets.otdStart(cal, 6, 1))
    @Test fun afterTheLastWrapsToJanuary() = assertEquals(0, Widgets.otdStart(cal, 12, 31))
    @Test fun emptyCalendar() = assertEquals(0, Widgets.otdStart(JSONArray(), 4, 4))
}
