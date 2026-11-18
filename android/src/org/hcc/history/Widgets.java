package org.hcc.history;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.io.InputStream;
import org.json.JSONArray;
import org.json.JSONObject;

class Widgets {
    static JSONArray verses;

    static String asset(Context c, String name) {
        try {
            InputStream in = c.getAssets().open(name);
            java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384]; int n;
            while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
            in.close();
            return b.toString("UTF-8");
        } catch (Exception e) { return ""; }
    }

    static JSONObject verse(Context c) {
        try {
            if (verses == null) verses = new JSONArray(asset(c, "verses.json"));
            return verses.getJSONObject(Daily.dayIndex(verses.length()));
        } catch (Exception e) { return null; }
    }

    static PendingIntent open(Context c, String hash, int req) {
        Intent i = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        i.putExtra("hash", hash);
        return PendingIntent.getActivity(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static RemoteViews card(Context c, String label, String text, String by, PendingIntent pi) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_card);
        v.setTextViewText(R.id.w_label, label);
        v.setTextViewText(R.id.w_text, text);
        v.setTextViewText(R.id.w_by, by);
        v.setOnClickPendingIntent(R.id.w_root, pi);
        return v;
    }

    static void verseW(Context c, AppWidgetManager m, int[] ids) {
        JSONObject o = verse(c);
        String t = o == null ? "Open the app to load today’s verse." : o.optString("t");
        String by = o == null ? "" : o.optString("r") + " · WEB";
        String hash = o == null ? "bible" : "bible~web~" + o.optString("b") + "~" + o.optInt("c") + "~" + o.optInt("v");
        for (int id : ids) m.updateAppWidget(id, card(c, "VERSE OF THE DAY", t, by, open(c, hash, 11)));
    }

    static void otdW(Context c, AppWidgetManager m, int[] ids) {
        String s = Daily.onThisDay(c);
        java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("d MMMM", java.util.Locale.ENGLISH);
        String day = f.format(new java.util.Date());
        for (int id : ids) m.updateAppWidget(id, card(c, "ON THIS DAY · " + day.toUpperCase(java.util.Locale.ENGLISH),
                s.length() > 0 ? s : "No anniversary in the calendar today. Tap to browse the year.", "Church history calendar", open(c, "ref-otd", 12)));
    }

    static void contW(Context c, AppWidgetManager m, int[] ids) {
        SharedPreferences p = c.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE);
        String t = p.getString("pt", ""), sub = p.getString("ps", ""), h = p.getString("ph", "home");
        for (int id : ids) m.updateAppWidget(id, card(c, "CONTINUE", t.length() > 0 ? t : "Start the series",
                t.length() > 0 ? sub : "Season 1 begins before Christ", open(c, h, 13)));
    }

    static void planW(Context c, AppWidgetManager m, int[] ids) {
        SharedPreferences p = c.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE);
        String plan = p.getString("plan", ""), bplan = p.getString("bplan", "");
        String text = bplan.length() > 0 ? bplan + (plan.length() > 0 ? "\n\n" + plan : "") : plan;
        String hash = bplan.length() > 0 ? "bible" : "ref-plans";
        for (int id : ids) m.updateAppWidget(id, card(c, "TODAY\u2019S READING", text.length() > 0 ? text : "No plan started. Tap to choose a reading plan.",
                bplan.length() > 0 ? "Bible reading plan" : "Reading plan", open(c, hash, 14)));
    }

    static void verseBig(Context c, AppWidgetManager m, int[] ids) {
        JSONObject o = verse(c);
        String hash = o == null ? "bible" : "bible~web~" + o.optString("b") + "~" + o.optInt("c") + "~" + o.optInt("v");
        for (int id : ids) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_verse_large);
            v.setTextViewText(R.id.wv_text, o == null ? "Open the app to load today\u2019s verse." : o.optString("t"));
            v.setTextViewText(R.id.wv_orig, o == null ? "" : o.optString("o"));
            v.setTextViewText(R.id.wv_ref, o == null ? "" : o.optString("r") + " \u00b7 WEB" + ("hbo".equals(o.optString("ol")) ? " \u00b7 Hebrew" : " \u00b7 Greek"));
            v.setOnClickPendingIntent(R.id.wv_root, open(c, hash, 15));
            m.updateAppWidget(id, v);
        }
    }

    static void all(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        QuoteWidget.render(c, m, m.getAppWidgetIds(new ComponentName(c, QuoteWidget.class)));
        verseW(c, m, m.getAppWidgetIds(new ComponentName(c, VerseWidget.class)));
        otdW(c, m, m.getAppWidgetIds(new ComponentName(c, OtdWidget.class)));
        contW(c, m, m.getAppWidgetIds(new ComponentName(c, ContinueWidget.class)));
        planW(c, m, m.getAppWidgetIds(new ComponentName(c, PlanWidget.class)));
        verseBig(c, m, m.getAppWidgetIds(new ComponentName(c, VerseLargeWidget.class)));
    }
}
