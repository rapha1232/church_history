package org.hcc.history;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** The arrow (next item) and "back to today" taps on a widget. Works on the lock screen without unlocking. */
public class WidgetAction extends BroadcastReceiver {
    static final String NEXT = "org.hcc.history.W_NEXT";
    static final String RESET = "org.hcc.history.W_RESET";

    @Override
    public void onReceive(Context c, Intent i) {
        int id = i.getIntExtra("id", -1);
        if (id < 0 || Widgets.kindOf(c, id) < 0) return;
        if (NEXT.equals(i.getAction())) Widgets.setOffset(c, id, Widgets.offset(c, id) + 1);
        else if (RESET.equals(i.getAction())) Widgets.setOffset(c, id, 0);
        Widgets.update(c, id);
    }
}
