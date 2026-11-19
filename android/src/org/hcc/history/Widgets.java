package org.hcc.history;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.SizeF;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/** Everything the home-screen and lock-screen widgets show: content, per-widget style, sizes and actions. */
class Widgets {
    static final int QUOTE = 0, VERSE = 1, OTD = 2, CONT = 3, PLAN = 4, VBIG = 5, TODAY = 6;
    static final String[] KEYS = {"quote", "verse", "otd", "continue", "plan", "verse_large", "today"};
    static final int[] NAMES = {R.string.widget_name, R.string.w_verse, R.string.w_otd, R.string.w_continue,
            R.string.w_plan, R.string.w_vbig, R.string.w_today};
    static final Class<?>[] PROVIDERS = {QuoteWidget.class, VerseWidget.class, OtdWidget.class, ContinueWidget.class,
            PlanWidget.class, VerseLargeWidget.class, TodayWidget.class};

    /* themes: 0 Night (the app), 1 Auto (Material You / follows dark mode), 2 Light, 3 Parchment, 4 Glass */
    static final int[] THEMES = {R.string.th_night, R.string.th_auto, R.string.th_light, R.string.th_parch, R.string.th_glass};
    static final int[] BG = {R.drawable.wbg_n, R.drawable.wbg_a, R.drawable.wbg_l, R.drawable.wbg_p, R.drawable.wbg_g};
    static final int[] BTN = {R.drawable.wbtn_n, R.drawable.wbtn_a, R.drawable.wbtn_l, R.drawable.wbtn_p, R.drawable.wbtn_g};
    static final int[] LINE = {R.drawable.wline_n, R.drawable.wline_a, R.drawable.wline_l, R.drawable.wline_p, R.drawable.wline_g};
    static final int[] IC_NEXT = {R.drawable.wic_next_n, R.drawable.wic_next_a, R.drawable.wic_next_l, R.drawable.wic_next_p, R.drawable.wic_next_g};
    static final int[] IC_SHARE = {R.drawable.wic_share_n, R.drawable.wic_share_a, R.drawable.wic_share_l, R.drawable.wic_share_p, R.drawable.wic_share_g};
    static final int[] IC_MARK = {R.drawable.wic_mark_n, R.drawable.wic_mark_a, R.drawable.wic_mark_l, R.drawable.wic_mark_p, R.drawable.wic_mark_g};
    static final int[] C_TEXT = {R.color.wn_text, R.color.wa_text, R.color.wl_text, R.color.wp_text, R.color.wg_text};
    static final int[] C_SUB = {R.color.wn_sub, R.color.wa_sub, R.color.wl_sub, R.color.wp_sub, R.color.wg_sub};
    static final int[] C_ACC = {R.color.wn_acc, R.color.wa_acc, R.color.wl_acc, R.color.wp_acc, R.color.wg_acc};
    static final int[] C_ACC2 = {R.color.wn_acc2, R.color.wa_acc2, R.color.wl_acc2, R.color.wp_acc2, R.color.wg_acc2};
    static final int[] SIZES = {R.string.sz_small, R.string.sz_medium, R.string.sz_large};
    static final int[] IC_FATHERS = {R.drawable.wic_fathers_n, R.drawable.wic_fathers_a, R.drawable.wic_fathers_l, R.drawable.wic_fathers_p, R.drawable.wic_fathers_g};

    /* strings in the app's language (Lang.wrap applies the in-app choice on Android 12 and older) */
    static Context L(Context c) { return Lang.wrap(c); }
    static String s(Context c, int id) { return L(c).getString(id); }
    static Locale loc(Context c) { return L(c).getResources().getConfiguration().getLocales().get(0); }
    static String up(Context c, int id) { return s(c, id).toUpperCase(loc(c)); }
    static final String WP = "widgets";

    static JSONArray verses, otd;

    /* ---------------- data ---------------- */

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

    static JSONArray verses(Context c) {
        try { if (verses == null) verses = new JSONArray(asset(c, "verses.json")); } catch (Exception e) { verses = new JSONArray(); }
        return verses;
    }

    static JSONObject verse(Context c) { return verseAt(c, 0); }

    static JSONObject verseAt(Context c, int off) {
        JSONArray a = verses(c); int n = a.length(); if (n == 0) return null;
        return a.optJSONObject(((Daily.dayIndex(n) + off) % n + n) % n);
    }

    static JSONObject quoteAt(Context c, int off) {
        JSONArray a = Daily.quotes(c); int n = a.length(); if (n == 0) return null;
        return a.optJSONObject(((Daily.dayIndex(n) + off) % n + n) % n);
    }

    /** The calendar entry on or after today, moved on by off entries: [month, day, year|null, text, episode, kind]. */
    static JSONArray otdAt(Context c, int off) {
        try {
            if (otd == null) otd = new JSONArray(asset(c, "onthisday.json"));
            int n = otd.length(); if (n == 0) return null;
            Calendar now = Calendar.getInstance();
            int start = otdStart(otd, now.get(Calendar.MONTH) + 1, now.get(Calendar.DAY_OF_MONTH));
            return otd.getJSONArray(((start + off) % n + n) % n);
        } catch (Exception e) { return null; }
    }

    /** Index of the first calendar entry on or after month/day (wrapping to January after the last one). */
    static int otdStart(JSONArray a, int month, int day) {
        int key = month * 100 + day, n = a.length(), i = 0;
        try { while (i < n && a.getJSONArray(i).getInt(0) * 100 + a.getJSONArray(i).getInt(1) < key) i++; } catch (Exception e) { return 0; }
        return i == n ? 0 : i;
    }

    static boolean isToday(JSONArray r) {
        Calendar now = Calendar.getInstance();
        return r != null && r.optInt(0) == now.get(Calendar.MONTH) + 1 && r.optInt(1) == now.get(Calendar.DAY_OF_MONTH);
    }

    static String dayMonth(Context c, JSONArray r) {
        Calendar k = Calendar.getInstance(); k.set(Calendar.DAY_OF_MONTH, 1); k.set(Calendar.MONTH, r.optInt(0) - 1); k.set(Calendar.DAY_OF_MONTH, r.optInt(1));
        return new SimpleDateFormat(android.text.format.DateFormat.getBestDateTimePattern(loc(c), "dMMMM"), loc(c)).format(k.getTime());
    }

    static String otdBy(Context c, JSONArray r) {
        if (r == null || r.isNull(2)) return s(c, R.string.c_calendar);
        int y = r.optInt(2), ago = Calendar.getInstance().get(Calendar.YEAR) - y;
        String ad = String.format(L(c).getString(R.string.c_ad), y);
        return ago > 0 ? ad + " · " + L(c).getResources().getQuantityString(R.plurals.c_years_ago, ago, String.format(loc(c), "%,d", ago)) : ad;
    }

    static String otdHash(JSONArray r) {
        String ep = r == null ? "" : r.optString(4);
        return ep.matches("[a-z]{1,5}-[0-9]{1,3}") ? ep : "ref-otd";
    }

    static String verseHash(JSONObject o) {
        return o == null ? "bible" : "bible~web~" + o.optString("b") + "~" + o.optInt("c") + "~" + o.optInt("v");
    }

    /* ---------------- per-widget options ---------------- */

    static final class Opt {
        int theme, size; boolean orig, buttons, priv;
        Opt copy() { Opt o = new Opt(); o.theme = theme; o.size = size; o.orig = orig; o.buttons = buttons; o.priv = priv; return o; }
    }

    static boolean hasOrig(int kind) { return kind == VERSE || kind == VBIG || kind == TODAY; }
    static boolean hasButtons(int kind) { return kind == QUOTE || kind == VERSE || kind == VBIG || kind == OTD; }
    static boolean isPersonal(int kind) { return kind == CONT || kind == PLAN; }

    static Opt opt(Context c, int id, int kind) {
        SharedPreferences p = c.getSharedPreferences(WP, Context.MODE_PRIVATE);
        Opt o = new Opt();
        o.theme = Math.max(0, Math.min(THEMES.length - 1, p.getInt("t" + id, 0)));
        o.size = Math.max(0, Math.min(2, p.getInt("s" + id, kind == VBIG ? 2 : 1)));
        o.orig = p.getBoolean("o" + id, kind == VBIG || kind == TODAY);
        o.buttons = p.getBoolean("b" + id, true);
        o.priv = p.getBoolean("p" + id, false);
        return o;
    }

    static void save(Context c, int id, Opt o) {
        c.getSharedPreferences(WP, Context.MODE_PRIVATE).edit().putInt("t" + id, o.theme).putInt("s" + id, o.size)
            .putBoolean("o" + id, o.orig).putBoolean("b" + id, o.buttons).putBoolean("p" + id, o.priv).apply();
    }

    static void forget(Context c, int[] ids) {
        SharedPreferences.Editor e = c.getSharedPreferences(WP, Context.MODE_PRIVATE).edit();
        for (int id : ids) for (String k : new String[]{"t", "s", "o", "b", "p", "k", "kd"}) e.remove(k + id);
        e.apply();
    }

    /** How far the reader has stepped on with the arrow today (it goes back to today's item at midnight). */
    static int offset(Context c, int id) {
        SharedPreferences p = c.getSharedPreferences(WP, Context.MODE_PRIVATE);
        return p.getInt("kd" + id, -1) == Daily.dayIndex(100000) ? p.getInt("k" + id, 0) : 0;
    }

    static void setOffset(Context c, int id, int k) {
        c.getSharedPreferences(WP, Context.MODE_PRIVATE).edit().putInt("k" + id, k).putInt("kd" + id, Daily.dayIndex(100000)).apply();
    }

    static int kindOf(Context c, int id) {
        android.appwidget.AppWidgetProviderInfo i = AppWidgetManager.getInstance(c).getAppWidgetInfo(id);
        if (i == null || !c.getPackageName().equals(i.provider.getPackageName())) return -1;
        for (int k = 0; k < PROVIDERS.length; k++) if (PROVIDERS[k].getName().equals(i.provider.getClassName())) return k;
        return -1;
    }

    /* ---------------- content ---------------- */

    static final class Content {
        String label = "", meta = "", text = "", orig = "", by = "", hash = "home", share = "", fathers = "";
        boolean nextable;
    }

    static Content content(Context c, int kind, int off, Opt o, boolean locked) {
        Content k = new Content();
        SharedPreferences p = c.getSharedPreferences(Daily.PREFS, Context.MODE_PRIVATE);
        if (kind == QUOTE) {
            JSONObject q = quoteAt(c, off);
            k.label = up(c, off == 0 ? R.string.c_quote : R.string.c_fathers); k.nextable = true;
            if (q == null) { k.text = s(c, R.string.c_load_quote); return k; }
            k.meta = q.optString("d"); k.text = "“" + q.optString("q") + "”"; k.by = "— " + Daily.cite(q);
            k.share = k.text + "\n— " + Daily.cite(q);
        } else if (kind == VERSE || kind == VBIG) {
            JSONObject v = verseAt(c, off);
            k.label = up(c, off == 0 ? R.string.c_verse : R.string.c_scripture); k.nextable = true;
            if (v == null) { k.text = s(c, R.string.c_load_verse); k.hash = "bible"; return k; }
            k.text = v.optString("t"); k.by = v.optString("r") + " · WEB"; k.hash = verseHash(v); k.fathers = k.hash + "~comm";
            if (o.orig) { k.orig = v.optString("o"); k.meta = s(c, "hbo".equals(v.optString("ol")) ? R.string.c_hebrew : R.string.c_greek); }
            k.share = k.text + "\n— " + v.optString("r") + " (World English Bible)";
        } else if (kind == OTD) {
            JSONArray r = otdAt(c, off); k.nextable = true; k.hash = "ref-otd";
            if (r == null) { k.label = up(c, R.string.c_otd); k.text = s(c, R.string.c_browse_year); return k; }
            boolean now = isToday(r);
            k.label = up(c, now ? R.string.c_otd : R.string.c_coming); k.meta = dayMonth(c, r).toUpperCase(loc(c));
            k.text = r.optString(3); k.by = otdBy(c, r); k.hash = otdHash(r);
            k.share = dayMonth(c, r) + (r.isNull(2) ? "" : ", " + r.optInt(2)) + ": " + r.optString(3);
        } else if (kind == CONT) {
            String t = p.getString("pt", ""), sub = p.getString("ps", "");
            k.label = up(c, R.string.w_continue); k.hash = p.getString("ph", "home");
            if (locked && o.priv && t.length() > 0) { k.text = s(c, R.string.c_place_saved); k.by = s(c, R.string.c_unlock_continue); }
            else if (t.length() > 0) { k.text = t; k.by = sub; }
            else { k.text = s(c, R.string.c_start); k.by = s(c, R.string.c_start_sub); k.hash = "home"; }
        } else if (kind == PLAN) {
            String plan = p.getString("plan", ""), bplan = p.getString("bplan", "");
            String text = bplan.length() > 0 ? bplan + (plan.length() > 0 ? "\n" + plan : "") : plan;
            k.label = up(c, R.string.w_plan); k.hash = bplan.length() > 0 ? "bible" : "ref-plans";
            if (text.length() == 0) { k.text = s(c, R.string.c_no_plan); k.by = s(c, R.string.c_choose_plan); }
            else if (locked && o.priv) { k.text = s(c, R.string.c_plan_ready); k.by = s(c, R.string.c_unlock_read); }
            else { k.text = text; k.by = s(c, bplan.length() > 0 ? R.string.c_bible_plan : R.string.c_plan); }
        }
        return k;
    }

    /* ---------------- rendering ---------------- */

    static PendingIntent open(Context c, String hash, int req) {
        Intent i = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        i.putExtra("hash", hash);
        i.setData(Uri.parse("hcc://open/" + req));
        return PendingIntent.getActivity(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent action(Context c, String act, int id, int kind) {
        Intent i = new Intent(c, WidgetAction.class).setAction(act).putExtra("id", id).putExtra("kind", kind);
        i.setData(Uri.parse("hcc://widget/" + id + "/" + act));
        return PendingIntent.getBroadcast(c, id * 8 + (WidgetAction.NEXT.equals(act) ? 1 : 2), i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent share(Context c, String text, int id) {
        Intent s = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text);
        Intent ch = Intent.createChooser(s, s(c, R.string.share)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(c, id * 8 + 3, ch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Text colour from a colour resource: from Android 12 the launcher resolves it, so Auto follows dark mode and wallpaper live. */
    static void color(Context c, RemoteViews v, int id, int res) {
        if (Build.VERSION.SDK_INT >= 31) v.setColor(id, "setTextColor", res);
        else v.setTextColor(id, c.getColor(res));
    }

    static float base(Opt o) { return o.size == 0 ? 14f : o.size == 2 ? 19f : 16f; }

    static void chrome(Context c, RemoteViews v, Opt o, String label, String meta) {
        int t = o.theme;
        v.setInt(android.R.id.background, "setBackgroundResource", BG[t]);
        v.setImageViewResource(R.id.w_mark, IC_MARK[t]);
        v.setTextViewText(R.id.w_label, label); color(c, v, R.id.w_label, C_ACC[t]);
        v.setTextViewText(R.id.w_meta, meta); color(c, v, R.id.w_meta, C_SUB[t]);
        v.setViewVisibility(R.id.w_meta, meta.length() > 0 ? View.VISIBLE : View.GONE);
    }

    static RemoteViews build(Context c, int kind, int id, Opt o, boolean locked, boolean small) {
        if (kind == TODAY) return small ? buildSmallToday(c, id, o) : buildToday(c, id, o, true);
        int off = offset(c, id), t = o.theme;
        Content k = content(c, kind, off, o, locked);
        int req = id * 8;
        if (small) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_compact);
            chrome(c, v, o, k.label, "");
            v.setTextViewText(R.id.w_text, k.text); color(c, v, R.id.w_text, C_TEXT[t]);
            v.setTextViewTextSize(R.id.w_text, TypedValue.COMPLEX_UNIT_SP, base(o) - 2f);
            v.setOnClickPendingIntent(android.R.id.background, open(c, k.hash, req));
            return v;
        }
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_main);
        boolean back = k.nextable && off != 0;
        chrome(c, v, o, k.label, back ? "↺ " + s(c, R.string.c_back_today) : k.meta);
        if (back) v.setOnClickPendingIntent(R.id.w_meta, action(c, WidgetAction.RESET, id, kind));
        v.setTextViewText(R.id.w_text, k.text); color(c, v, R.id.w_text, C_TEXT[t]);
        float sz = base(o) + (kind == VBIG ? 2f : 0f) + (isPersonal(kind) ? 1f : 0f);
        v.setTextViewTextSize(R.id.w_text, TypedValue.COMPLEX_UNIT_SP, sz);
        v.setInt(R.id.w_text, "setMaxLines", kind == VBIG ? 7 : isPersonal(kind) ? 4 : 8);
        v.setTextViewText(R.id.w_orig, k.orig); color(c, v, R.id.w_orig, C_ACC2[t]);
        v.setTextViewTextSize(R.id.w_orig, TypedValue.COMPLEX_UNIT_SP, sz - 1f);
        v.setViewVisibility(R.id.w_orig, k.orig.length() > 0 ? View.VISIBLE : View.GONE);
        v.setTextViewText(R.id.w_by, k.by); color(c, v, R.id.w_by, C_SUB[t]);
        v.setViewVisibility(R.id.w_by, k.by.length() > 0 ? View.VISIBLE : View.GONE);
        boolean btn = o.buttons && hasButtons(kind);
        v.setViewVisibility(R.id.w_next, btn && k.nextable ? View.VISIBLE : View.GONE);
        v.setInt(R.id.w_next, "setBackgroundResource", BTN[t]); v.setImageViewResource(R.id.w_next, IC_NEXT[t]);
        v.setOnClickPendingIntent(R.id.w_next, action(c, WidgetAction.NEXT, id, kind));
        /* sharing opens a chooser, which needs the phone unlocked: leave it off the lock screen */
        boolean sh = btn && !locked && k.share.length() > 0;
        v.setViewVisibility(R.id.w_share, sh ? View.VISIBLE : View.GONE);
        if (sh) { v.setInt(R.id.w_share, "setBackgroundResource", BTN[t]); v.setImageViewResource(R.id.w_share, IC_SHARE[t]); v.setOnClickPendingIntent(R.id.w_share, share(c, k.share, id)); }
        /* what the Fathers said about this verse: opens the verse with its commentary */
        boolean fa = btn && k.fathers.length() > 0;
        v.setViewVisibility(R.id.w_fathers, fa ? View.VISIBLE : View.GONE);
        if (fa) { v.setInt(R.id.w_fathers, "setBackgroundResource", BTN[t]); v.setImageViewResource(R.id.w_fathers, IC_FATHERS[t]); v.setOnClickPendingIntent(R.id.w_fathers, open(c, k.fathers, req + 7)); }
        v.setOnClickPendingIntent(android.R.id.background, open(c, k.hash, req));
        if (Build.VERSION.SDK_INT >= 31) v.setContentDescription(android.R.id.background, k.label + ". " + k.text + ". " + k.by);
        return v;
    }

    static RemoteViews buildSmallToday(Context c, int id, Opt o) {
        Opt q = o.copy(); q.orig = false;
        RemoteViews v = build(c, VERSE, id, q, true, true);
        v.setTextViewText(R.id.w_label, longDate(c, new Date()).toUpperCase(loc(c)));
        return v;
    }

    static RemoteViews buildToday(Context c, int id, Opt o, boolean withQuote) {
        int t = o.theme; float b = base(o) - 1f;
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_today);
        Calendar now = Calendar.getInstance(); int hr = now.get(Calendar.HOUR_OF_DAY);
        chrome(c, v, o, up(c, hr < 5 ? R.string.c_night : hr < 12 ? R.string.c_morning : hr < 18 ? R.string.c_afternoon : R.string.c_evening), "");
        v.setTextViewText(R.id.t_date, longDate(c, now.getTime()));
        v.setTextViewText(R.id.t_v_lbl, up(c, R.string.c_verse_short));
        v.setTextViewText(R.id.t_q_lbl, up(c, R.string.c_fathers));
        color(c, v, R.id.t_date, C_TEXT[t]);
        v.setTextViewTextSize(R.id.t_date, TypedValue.COMPLEX_UNIT_SP, b + 7f);
        int[][] secs = {{R.id.t_v_lbl, R.id.t_v_text, R.id.t_v_by}, {R.id.t_q_lbl, R.id.t_q_text, R.id.t_q_by}, {R.id.t_o_lbl, R.id.t_o_text, R.id.t_o_by}};
        for (int[] s : secs) {
            color(c, v, s[0], C_ACC[t]); color(c, v, s[1], C_TEXT[t]); color(c, v, s[2], C_SUB[t]);
            v.setTextViewTextSize(s[1], TypedValue.COMPLEX_UNIT_SP, b);
        }
        for (int l : new int[]{R.id.t_q_line, R.id.t_o_line}) v.setInt(l, "setBackgroundResource", LINE[t]);
        JSONObject vs = verse(c);
        v.setTextViewText(R.id.t_v_text, vs == null ? s(c, R.string.c_load_verse) : vs.optString("t"));
        v.setTextViewText(R.id.t_v_by, vs == null ? "" : vs.optString("r") + " · WEB");
        boolean orig = o.orig && vs != null && vs.optString("o").length() > 0;
        v.setViewVisibility(R.id.t_v_orig, orig ? View.VISIBLE : View.GONE);
        if (orig) { v.setTextViewText(R.id.t_v_orig, vs.optString("o")); color(c, v, R.id.t_v_orig, C_ACC2[t]); v.setTextViewTextSize(R.id.t_v_orig, TypedValue.COMPLEX_UNIT_SP, b - 1f); }
        v.setOnClickPendingIntent(R.id.t_v, open(c, verseHash(vs), id * 8 + 4));
        JSONObject q = quoteAt(c, 0);
        v.setViewVisibility(R.id.t_q, withQuote && q != null ? View.VISIBLE : View.GONE);
        v.setViewVisibility(R.id.t_q_line, withQuote && q != null ? View.VISIBLE : View.GONE);
        if (q != null) {
            v.setTextViewText(R.id.t_q_text, "“" + q.optString("q") + "”");
            v.setTextViewText(R.id.t_q_by, Daily.cite(q));
            v.setOnClickPendingIntent(R.id.t_q, open(c, "home", id * 8 + 5));
        }
        JSONArray r = otdAt(c, 0);
        if (r != null) {
            boolean today = isToday(r);
            v.setTextViewText(R.id.t_o_lbl, today ? up(c, R.string.c_otd) : up(c, R.string.c_coming) + " · " + dayMonth(c, r).toUpperCase(loc(c)));
            v.setTextViewText(R.id.t_o_text, r.optString(3));
            v.setTextViewText(R.id.t_o_by, otdBy(c, r));
            v.setOnClickPendingIntent(R.id.t_o, open(c, otdHash(r), id * 8 + 6));
        }
        v.setOnClickPendingIntent(android.R.id.background, open(c, "home", id * 8));
        return v;
    }

    static String longDate(Context c, Date d) {
        return new SimpleDateFormat(android.text.format.DateFormat.getBestDateTimePattern(loc(c), "EEEEdMMMM"), loc(c)).format(d);
    }

    /** The views for one placed widget: a small and a full layout that the launcher picks between as it is resized. */
    static RemoteViews views(Context c, AppWidgetManager m, int kind, int id) {
        Opt o = opt(c, id, kind);
        Bundle b = m.getAppWidgetOptions(id);
        boolean locked = b != null && b.getInt(AppWidgetManager.OPTION_APPWIDGET_HOST_CATEGORY, 0) == android.appwidget.AppWidgetProviderInfo.WIDGET_CATEGORY_KEYGUARD;
        if (Build.VERSION.SDK_INT >= 31) {
            Map<SizeF, RemoteViews> map = new HashMap<>();
            map.put(new SizeF(100f, 40f), build(c, kind, id, o, locked, true));
            if (kind == TODAY) {
                map.put(new SizeF(200f, 170f), buildToday(c, id, o, false));
                map.put(new SizeF(200f, 300f), buildToday(c, id, o, true));
            } else {
                map.put(new SizeF(170f, 100f), build(c, kind, id, o, locked, false));
            }
            return new RemoteViews(map);
        }
        int w = b == null ? 250 : b.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250);
        int h = b == null ? 110 : b.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 110);
        if (kind == TODAY) return h < 170 || w < 200 ? build(c, kind, id, o, locked, true) : buildToday(c, id, o, h >= 300);
        return build(c, kind, id, o, locked, h < 100 || w < 170);
    }

    static void update(Context c, AppWidgetManager m, int kind, int id) {
        try { m.updateAppWidget(id, views(c, m, kind, id)); } catch (Exception e) { }
    }

    static void update(Context c, int id) {
        int kind = kindOf(c, id);
        if (kind >= 0) update(c, AppWidgetManager.getInstance(c), kind, id);
    }

    static void all(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        if (m == null) return;
        for (int k = 0; k < PROVIDERS.length; k++)
            for (int id : m.getAppWidgetIds(new ComponentName(c, PROVIDERS[k]))) update(c, m, k, id);
    }

    /** All placed widgets of this app, as [kind, id] pairs. */
    static List<int[]> placed(Context c) {
        List<int[]> out = new ArrayList<>();
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        if (m == null) return out;
        for (int k = 0; k < PROVIDERS.length; k++)
            for (int id : m.getAppWidgetIds(new ComponentName(c, PROVIDERS[k]))) out.add(new int[]{k, id});
        return out;
    }

    static boolean canPin(Context c) {
        if (Build.VERSION.SDK_INT < 26) return false;
        AppWidgetManager m = c.getSystemService(AppWidgetManager.class);
        return m != null && m.isRequestPinAppWidgetSupported();
    }

    static boolean pin(Context c, int kind) {
        if (!canPin(c) || kind < 0 || kind >= PROVIDERS.length) return false;
        return c.getSystemService(AppWidgetManager.class).requestPinAppWidget(new ComponentName(c, PROVIDERS[kind]), null, null);
    }

    static int kindByKey(String key) {
        for (int k = 0; k < KEYS.length; k++) if (KEYS[k].equals(key)) return k;
        return -1;
    }
}
