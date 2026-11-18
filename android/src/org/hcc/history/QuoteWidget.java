package org.hcc.history;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class QuoteWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        render(c, m, ids);
        Daily.schedule(c);
    }
    static void render(Context c, AppWidgetManager m, int[] ids) {
        JSONObject o = Daily.today(c);
        Intent open = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 2, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        for (int id : ids) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_quote);
            if (o != null) {
                v.setTextViewText(R.id.wq_text, "“" + o.optString("q") + "”");
                v.setTextViewText(R.id.wq_by, "— " + Daily.cite(o));
            }
            v.setOnClickPendingIntent(R.id.wq_root, pi);
            m.updateAppWidget(id, v);
        }
    }
}
