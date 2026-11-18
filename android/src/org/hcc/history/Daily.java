package org.hcc.history;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.io.InputStream;
import java.util.Calendar;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

class Daily {
    static final String PREFS = "daily";
    static final String CH = "quote";
    static JSONArray cache;

    static JSONArray quotes(Context c) {
        if (cache != null) return cache;
        try {
            InputStream in = c.getAssets().open("quotes.json");
            java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384]; int n;
            while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
            in.close();
            cache = new JSONArray(b.toString("UTF-8"));
        } catch (Exception e) { cache = new JSONArray(); }
        return cache;
    }

    static int dayIndex(int len) {
        Calendar now = Calendar.getInstance();
        Calendar u = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        u.clear(); u.set(now.get(Calendar.YEAR), now.get(Calendar.MONTH), now.get(Calendar.DAY_OF_MONTH));
        Calendar a = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        a.clear(); a.set(2026, 0, 1);
        long days = (u.getTimeInMillis() - a.getTimeInMillis()) / 86400000L;
        if (len <= 0) return 0;
        return (int) (((days % len) + len) % len);
    }

    static JSONObject today(Context c) {
        JSONArray q = quotes(c);
        try { return q.getJSONObject(dayIndex(q.length())); } catch (Exception e) { return null; }
    }

    static String onThisDay(Context c) {
        try {
            InputStream in = c.getAssets().open("onthisday.json");
            java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384]; int n;
            while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
            in.close();
            JSONArray a = new JSONArray(b.toString("UTF-8"));
            Calendar now = Calendar.getInstance();
            int mo = now.get(Calendar.MONTH) + 1, d = now.get(Calendar.DAY_OF_MONTH);
            for (int i = 0; i < a.length(); i++) {
                JSONArray r = a.getJSONArray(i);
                if (r.getInt(0) == mo && r.getInt(1) == d) {
                    String y = r.isNull(2) ? "" : (r.getInt(2) + ": ");
                    return y + r.getString(3);
                }
            }
        } catch (Exception e) { }
        return "";
    }

    static String cite(JSONObject o) {
        String s = o.optString("a");
        String w = o.optString("w"), ci = o.optString("c");
        if (w.length() > 0) s += ", " + w;
        if (ci.length() > 0) s += ", " + ci;
        return s;
    }

    static PendingIntent alarmIntent(Context c, String action) {
        Intent i = new Intent(c, DailyReceiver.class).setAction(action);
        return PendingIntent.getBroadcast(c, action.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        PendingIntent quote = alarmIntent(c, DailyReceiver.ACT_QUOTE);
        am.cancel(quote);
        if (p.getBoolean("on", false)) {
            Calendar t = Calendar.getInstance();
            t.set(Calendar.HOUR_OF_DAY, p.getInt("h", 8)); t.set(Calendar.MINUTE, p.getInt("m", 0)); t.set(Calendar.SECOND, 0); t.set(Calendar.MILLISECOND, 0);
            if (t.getTimeInMillis() <= System.currentTimeMillis() + 5000) t.add(Calendar.DAY_OF_MONTH, 1);
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t.getTimeInMillis(), quote);
        }
        PendingIntent verse = alarmIntent(c, DailyReceiver.ACT_VERSE);
        am.cancel(verse);
        if (p.getBoolean("von", false)) {
            Calendar t = Calendar.getInstance();
            t.set(Calendar.HOUR_OF_DAY, p.getInt("vh", 7)); t.set(Calendar.MINUTE, p.getInt("vm", 0)); t.set(Calendar.SECOND, 0); t.set(Calendar.MILLISECOND, 0);
            if (t.getTimeInMillis() <= System.currentTimeMillis() + 5000) t.add(Calendar.DAY_OF_MONTH, 1);
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t.getTimeInMillis(), verse);
        }
        Calendar mid = Calendar.getInstance();
        mid.add(Calendar.DAY_OF_MONTH, 1); mid.set(Calendar.HOUR_OF_DAY, 0); mid.set(Calendar.MINUTE, 2); mid.set(Calendar.SECOND, 0);
        am.set(AlarmManager.RTC, mid.getTimeInMillis(), alarmIntent(c, DailyReceiver.ACT_WIDGET));
    }

    static void notifyQuote(Context c) {
        JSONObject o = today(c); if (o == null) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel ch = new NotificationChannel(CH, "Quote of the day", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("A daily quotation from the Church Fathers");
            nm.createNotificationChannel(ch);
        }
        Intent open = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String q = o.optString("q");
        SharedPreferences pr = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String extra = "";
        String plan = pr.getString("plan", "");
        if (plan.length() > 0) extra += "\n\nToday\u2019s reading: " + plan;
        if (pr.getBoolean("otd", true)) { String ot = onThisDay(c); if (ot.length() > 0) extra += "\n\nOn this day: " + ot; }
        android.app.Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new android.app.Notification.Builder(c, CH) : new android.app.Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat).setContentTitle(o.optString("a")).setContentText(q)
         .setStyle(new android.app.Notification.BigTextStyle().bigText("“" + q + "”\n— " + cite(o)))
         .setContentIntent(pi).setAutoCancel(true).setColor(0xFFA3341D);
        try { nm.notify(7, b.build()); } catch (SecurityException e) { }
    }

    static void notifyVerse(Context c) {
        JSONObject o = Widgets.verse(c); if (o == null) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel("verse") == null) {
            NotificationChannel ch = new NotificationChannel("verse", "Verse of the day", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("A Bible verse each day");
            ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
        String t = o.optString("t"), r = o.optString("r"), og = o.optString("o");
        android.app.Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new android.app.Notification.Builder(c, "verse") : new android.app.Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat).setContentTitle(r).setContentText(t)
         .setStyle(new android.app.Notification.BigTextStyle().bigText(t + (og.length() > 0 ? "\n\n" + og : "") + "\n\n" + r + " (World English Bible)"))
         .setContentIntent(Widgets.open(c, "bible~web~" + o.optString("b") + "~" + o.optInt("c") + "~" + o.optInt("v"), 21))
         .setVisibility(android.app.Notification.VISIBILITY_PUBLIC)
         .setAutoCancel(true).setColor(0xFF2C5B8C);
        try { nm.notify(8, b.build()); } catch (SecurityException e) { }
    }

    static void updateWidgets(Context c) {
        Widgets.all(c);
    }
}
