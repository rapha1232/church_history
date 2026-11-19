package org.hcc.history;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;

/** Shared behaviour of every widget: draw, redraw on resize or when moved to the lock screen, forget settings when removed. */
public abstract class BaseWidget extends AppWidgetProvider {
    abstract int kind();

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) Widgets.update(c, m, kind(), id);
        Daily.schedule(c);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle options) {
        Widgets.update(c, m, kind(), id);
    }

    @Override
    public void onDeleted(Context c, int[] ids) {
        Widgets.forget(c, ids);
    }
}
