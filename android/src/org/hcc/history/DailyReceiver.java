package org.hcc.history;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class DailyReceiver extends BroadcastReceiver {
    static final String ACT_QUOTE = "org.hcc.history.QUOTE";
    static final String ACT_WIDGET = "org.hcc.history.WIDGET";
    static final String ACT_VERSE = "org.hcc.history.VERSE";
    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (ACT_QUOTE.equals(a)) Daily.notifyQuote(c);
        if (ACT_VERSE.equals(a)) Daily.notifyVerse(c);
        /* time, time-zone and language changes move "today", so redraw */
        Daily.updateWidgets(c);
        Daily.schedule(c);
    }
}
