package org.hcc.history;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.RemoteViews;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import java.util.List;

/**
 * Widget style screen. Opened by the launcher ("Customize" on Android 12 and later) for one widget,
 * or from the app with no widget id, when it lists the placed widgets and offers to add new ones.
 */
public class WidgetConfig extends Activity {
    static final int BG = 0xFF0B0C10, CARD = 0xFF14161D, TEXT = 0xFFF3EEE4, SUB = 0xFFB9B4AA, GOLD = 0xFFE2B85B, LINE = 0x22FFFFFF;

    int id = AppWidgetManager.INVALID_APPWIDGET_ID, kind = -1;
    Widgets.Opt opt;
    boolean lockPreview;
    ScrollView scroll;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        id = getIntent().getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (id != AppWidgetManager.INVALID_APPWIDGET_ID) {
            kind = Widgets.kindOf(this, id);
            if (kind < 0) { finish(); return; }
            opt = Widgets.opt(this, id, kind);
            lockPreview = isLocked();
            /* a launcher that insists on showing this screen when the widget is added keeps the widget with its defaults on Back */
            setResult(RESULT_OK, new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id));
        }
        scroll = new ScrollView(this);
        scroll.setBackgroundColor(BG);
        scroll.setFillViewport(true);
        setContentView(scroll);
        render();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (kind < 0) render();   // the list may have changed after adding a widget
    }

    boolean isLocked() {
        Bundle b = AppWidgetManager.getInstance(this).getAppWidgetOptions(id);
        return b != null && b.getInt(AppWidgetManager.OPTION_APPWIDGET_HOST_CATEGORY, 0) == android.appwidget.AppWidgetProviderInfo.WIDGET_CATEGORY_KEYGUARD;
    }

    int dp(float v) { return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics())); }

    TextView text(String s, float sp, int color, boolean serif) {
        TextView t = new TextView(this);
        t.setText(s); t.setTextSize(sp); t.setTextColor(color);
        if (serif) t.setTypeface(Typeface.SERIF);
        return t;
    }

    TextView heading(String s) {
        TextView t = text(s.toUpperCase(java.util.Locale.ENGLISH), 11, GOLD, false);
        t.setTypeface(Typeface.DEFAULT_BOLD); t.setLetterSpacing(0.16f);
        t.setPadding(0, dp(22), 0, dp(10));
        return t;
    }

    GradientDrawable round(int fill, int stroke, float r) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(fill); g.setCornerRadius(dp(r));
        if (stroke != 0) g.setStroke(dp(stroke == GOLD ? 2 : 1), stroke);
        return g;
    }

    TextView chip(String label, boolean on, View.OnClickListener l) {
        TextView t = text(label, 14, on ? 0xFF1A1408 : TEXT, false);
        t.setBackground(round(on ? GOLD : CARD, on ? 0 : LINE, 20));
        t.setPadding(dp(16), dp(10), dp(16), dp(10));
        t.setGravity(Gravity.CENTER);
        t.setMinHeight(dp(44));
        t.setOnClickListener(l);
        t.setSelected(on);
        t.setContentDescription(label + (on ? ", selected" : ""));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMarginEnd(dp(8)); t.setLayoutParams(lp);
        return t;
    }

    View row(View... kids) {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        for (View k : kids) r.addView(k);
        HorizontalScrollView h = new HorizontalScrollView(this);
        h.setHorizontalScrollBarEnabled(false);
        h.addView(r);
        return h;
    }

    Switch toggle(String label, String hint, boolean on, android.widget.CompoundButton.OnCheckedChangeListener l) {
        Switch s = new Switch(this);
        s.setText(hint == null ? label : label + "\n" + hint);
        s.setTextColor(TEXT); s.setTextSize(15);
        s.setChecked(on);
        s.setPadding(0, dp(10), 0, dp(10));
        s.setMinHeight(dp(52));
        s.setOnCheckedChangeListener(l);
        return s;
    }

    void render() {
        int y = scroll.getScrollY();
        scroll.removeAllViews();
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(dp(20), dp(24), dp(20), dp(32));
        scroll.addView(col);
        if (kind < 0) renderList(col); else renderEditor(col);
        scroll.post(() -> scroll.scrollTo(0, y));
    }

    /* ---------------- one widget ---------------- */

    void renderEditor(LinearLayout col) {
        col.addView(text("Widget style", 26, TEXT, true));
        TextView sub = text(Widgets.NAMES[kind], 14, SUB, false);
        sub.setPadding(0, dp(4), 0, dp(16));
        col.addView(sub);

        /* live preview, on a wallpaper-like backdrop */
        LinearLayout stage = new LinearLayout(this);
        stage.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable wall = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                lockPreview ? new int[]{0xFF0E1726, 0xFF2A1E3A, 0xFF3B2618} : new int[]{0xFF31465E, 0xFF5B4A6E, 0xFF8A6A48});
        wall.setCornerRadius(dp(24));
        stage.setBackground(wall);
        stage.setPadding(dp(14), dp(14), dp(14), dp(14));
        if (lockPreview) {
            TextView clock = text(new java.text.SimpleDateFormat("H:mm", java.util.Locale.getDefault()).format(new java.util.Date()), 54, 0xFFFFFFFF, false);
            clock.setGravity(Gravity.CENTER); clock.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
            clock.setPadding(0, dp(6), 0, dp(14));
            stage.addView(clock);
        }
        FrameLayout host = new FrameLayout(this);
        int h = kind == Widgets.TODAY ? 420 : kind == Widgets.VBIG ? 280 : Widgets.isPersonal(kind) ? 120 : 190;
        stage.addView(host, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(h)));
        try {
            RemoteViews rv = Widgets.build(this, kind, id, opt, lockPreview, false);
            View v = rv.apply(getApplicationContext(), host);
            v.setClickable(false);
            host.addView(v, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        } catch (Exception e) {
            host.addView(text("Preview unavailable", 14, SUB, false));
        }
        col.addView(stage);

        col.addView(heading("Preview"));
        col.addView(row(chip("Home screen", !lockPreview, v -> { lockPreview = false; render(); }),
                        chip("Lock screen", lockPreview, v -> { lockPreview = true; render(); })));

        col.addView(heading("Theme"));
        View[] themes = new View[Widgets.THEMES.length];
        for (int i = 0; i < themes.length; i++) {
            final int t = i;
            themes[i] = chip(Widgets.THEMES[i], opt.theme == i, v -> { opt.theme = t; render(); });
        }
        col.addView(row(themes));
        TextView th = text(themeHint(opt.theme), 13, SUB, false);
        th.setPadding(0, dp(8), 0, 0);
        col.addView(th);

        col.addView(heading("Text size"));
        View[] sizes = new View[3];
        for (int i = 0; i < 3; i++) {
            final int s = i;
            sizes[i] = chip(Widgets.SIZES[i], opt.size == i, v -> { opt.size = s; render(); });
        }
        col.addView(row(sizes));

        col.addView(heading("Show"));
        if (Widgets.hasOrig(kind))
            col.addView(toggle("Greek or Hebrew", "The verse in the original language", opt.orig, (b, on) -> { opt.orig = on; render(); }));
        if (Widgets.hasButtons(kind))
            col.addView(toggle("Buttons", "Arrow for the next one, and share (home screen)", opt.buttons, (b, on) -> { opt.buttons = on; render(); }));
        if (Widgets.isPersonal(kind))
            col.addView(toggle("Private on the lock screen", "Hide what you are reading until the phone is unlocked", opt.priv, (b, on) -> { opt.priv = on; render(); }));

        TextView tip = text(tip(), 13, SUB, false);
        tip.setPadding(0, dp(18), 0, dp(8));
        tip.setLineSpacing(0, 1.3f);
        col.addView(tip);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.END);
        bar.setPadding(0, dp(16), 0, 0);
        TextView cancel = chip("Cancel", false, v -> finish());
        TextView save = chip("Save style", true, v -> {
            Widgets.save(this, id, opt);
            Widgets.update(this, id);
            setResult(RESULT_OK, new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id));
            finish();
        });
        bar.addView(cancel); bar.addView(save);
        col.addView(bar);
    }

    String themeHint(int t) {
        switch (t) {
            case 1: return android.os.Build.VERSION.SDK_INT >= 31 ? "Takes its colours from your wallpaper and follows dark mode." : "Light by day, dark when dark mode is on.";
            case 2: return "Paper white with the app’s red.";
            case 3: return "Warm parchment, like an old book.";
            case 4: return "See-through, for photos and the lock screen.";
            default: return "The app’s own dark look with gold.";
        }
    }

    String tip() {
        StringBuilder s = new StringBuilder();
        if (Widgets.hasButtons(kind)) s.append("The arrow shows another one; the widget returns to today’s at midnight, or tap “↺ Today”.\n");
        s.append("On the lock screen, tapping the widget asks you to unlock first. ");
        s.append(android.os.Build.VERSION.SDK_INT >= 31 ? "To come back here, touch and hold the widget and choose Customize (or the pencil)."
                : "To come back here, open the app and choose Customize widgets.");
        return s.toString();
    }

    /* ---------------- list of placed widgets, and adding new ones ---------------- */

    void renderList(LinearLayout col) {
        col.addView(text("Widgets", 26, TEXT, true));
        TextView sub = text("Home screen and lock screen", 14, SUB, false);
        sub.setPadding(0, dp(4), 0, dp(4));
        col.addView(sub);

        List<int[]> placed = Widgets.placed(this);
        col.addView(heading("Your widgets"));
        if (placed.isEmpty()) col.addView(text("None yet. Add one below, or from your launcher’s widget list.", 15, SUB, false));
        for (int[] p : placed) {
            Widgets.Opt o = Widgets.opt(this, p[1], p[0]);
            Bundle b = AppWidgetManager.getInstance(this).getAppWidgetOptions(p[1]);
            boolean lock = b != null && b.getInt(AppWidgetManager.OPTION_APPWIDGET_HOST_CATEGORY, 0) == android.appwidget.AppWidgetProviderInfo.WIDGET_CATEGORY_KEYGUARD;
            col.addView(card(Widgets.NAMES[p[0]], (lock ? "Lock screen" : "Home screen") + " · " + Widgets.THEMES[o.theme] + " · " + Widgets.SIZES[o.size] + " text", "Edit",
                    v -> startActivity(new Intent(this, WidgetConfig.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, p[1]))));
        }

        col.addView(heading("Add a widget"));
        boolean pin = Widgets.canPin(this);
        if (!pin) {
            TextView how = text("Touch and hold an empty spot on your home screen, choose Widgets, then find Church History.", 15, SUB, false);
            how.setPadding(0, 0, 0, dp(14));
            col.addView(how);
        }
        String[] what = {"A saying of the Church Fathers, with an arrow for more", "A verse each day; tap to read the chapter",
                "Today in church history, or the next anniversary", "The episode or chapter you were reading",
                "The next step in your reading plan", "The verse with the original Greek or Hebrew", "Date, verse, the Fathers and the calendar in one card"};
        int[] order = {Widgets.TODAY, Widgets.VERSE, Widgets.VBIG, Widgets.QUOTE, Widgets.OTD, Widgets.CONT, Widgets.PLAN};
        for (int k : order) {
            final int kk = k;
            col.addView(card(Widgets.NAMES[k], what[k], pin ? "Add" : null, v -> Widgets.pin(this, kk)));
        }
        TextView lock = text("Lock screen: on phones and tablets that support lock-screen widgets (Android 16 QPR2 and later, Pixel Tablet hub), "
                + "open the lock screen’s widget area and add any Church History widget. Turn on “Private on the lock screen” for the reading widgets if others can see your phone.", 13, SUB, false);
        lock.setPadding(0, dp(18), 0, 0);
        lock.setLineSpacing(0, 1.3f);
        col.addView(lock);
    }

    View card(String title, String detail, String action, View.OnClickListener l) {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.HORIZONTAL);
        c.setGravity(Gravity.CENTER_VERTICAL);
        c.setBackground(round(CARD, LINE, 16));
        c.setPadding(dp(16), dp(12), dp(12), dp(12));
        c.setMinimumHeight(dp(64));
        LinearLayout t = new LinearLayout(this);
        t.setOrientation(LinearLayout.VERTICAL);
        t.addView(text(title, 16, TEXT, true));
        TextView d = text(detail, 13, SUB, false);
        d.setPadding(0, dp(2), 0, 0);
        t.addView(d);
        c.addView(t, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        if (action != null) {
            c.addView(chip(action, false, l));
            c.setOnClickListener(l);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = dp(8);
        c.setLayoutParams(lp);
        return c;
    }
}
