"""Generate the Android widget resources: theme colours, backgrounds, icons, layouts, previews
and the appwidget-provider files. Run from the repository root:  python3 tools/widget_res.py
Everything it writes lives under android/res and is committed, so the APK build does not need it."""
import os

RES = 'android/res'
A = 'xmlns:android="http://schemas.android.com/apk/res/android"'

# theme key -> (text, sub, accent, accent2, background, stroke)
THEMES = {
    'n': ('#F3EEE4', '#B9B4AA', '#E2B85B', '#D9C9A3', '#F214161D', '#22FFFFFF'),   # Night (the app's look)
    'l': ('#1D1B18', '#6A635A', '#A3341D', '#7A5A1E', '#FAFBF8F2', '#16000000'),   # Light
    'p': ('#2E2216', '#6F5C46', '#8A2B12', '#6B4E1F', '#F7EADBBE', '#26704F2A'),   # Parchment
    'g': ('#FFFFFF', '#E0FFFFFF', '#F2D27E', '#EADFC4', '#66000000', '#30FFFFFF'),  # Glass (over the wallpaper)
}
# Auto follows the system: light/dark below Android 12, Material You colours from Android 12
AUTO_V31_DAY = ('@android:color/system_neutral1_900', '@android:color/system_neutral2_700', '@android:color/system_accent1_600',
                '@android:color/system_accent3_600', '@android:color/system_neutral1_50', '#16000000')
AUTO_V31_NIGHT = ('@android:color/system_neutral1_50', '@android:color/system_neutral2_200', '@android:color/system_accent1_200',
                  '@android:color/system_accent3_200', '@android:color/system_neutral1_900', '#22FFFFFF')
SLOTS = ('text', 'sub', 'acc', 'acc2', 'bg', 'line')


def w(path, s):
    path = os.path.join(RES, path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write('<?xml version="1.0" encoding="utf-8"?>\n' + s.strip() + '\n')


def colors(sets):
    return '<resources>\n' + ''.join('    <color name="w%s_%s">%s</color>\n' % (k, slot, v)
                                     for k, vals in sets.items() for slot, v in zip(SLOTS, vals)) + '</resources>'


w('values/widget_colors.xml', colors(dict(THEMES, a=THEMES['l'])))
w('values-night/widget_colors.xml', colors({'a': THEMES['n']}))
w('values-v31/widget_colors.xml', colors({'a': AUTO_V31_DAY}))
w('values-night-v31/widget_colors.xml', colors({'a': AUTO_V31_NIGHT}))

w('values/widget_dimens.xml', '<resources>\n    <dimen name="w_radius">22dp</dimen>\n</resources>')
w('values-v31/widget_dimens.xml', '<resources>\n    <dimen name="w_radius">@android:dimen/system_app_widget_background_radius</dimen>\n</resources>')

ICONS = {
    'next': 'M12,4l-1.41,1.41L16.17,11H4v2h12.17l-5.58,5.59L12,20l8,-8z',
    'share': 'M18,16.08c-0.76,0 -1.44,0.3 -1.96,0.77L8.91,12.7c0.05,-0.23 0.09,-0.46 0.09,-0.7s-0.04,-0.47 -0.09,-0.7l7.05,-4.11'
             'c0.54,0.5 1.25,0.81 2.04,0.81 1.66,0 3,-1.34 3,-3s-1.34,-3 -3,-3 -3,1.34 -3,3c0,0.24 0.04,0.47 0.09,0.7L8.04,9.81'
             'C7.5,9.31 6.79,9 6,9c-1.66,0 -3,1.34 -3,3s1.34,3 3,3c0.79,0 1.5,-0.31 2.04,-0.81l7.12,4.16c-0.05,0.21 -0.08,0.43 -0.08,0.65'
             ' 0,1.61 1.31,2.92 2.92,2.92s2.92,-1.31 2.92,-2.92 -1.31,-2.92 -2.92,-2.92z',
}
for k in ('a', 'n', 'l', 'p', 'g'):
    w('drawable/wbg_%s.xml' % k, '''
<shape %s android:shape="rectangle">
    <solid android:color="@color/w%s_bg"/>
    <corners android:radius="@dimen/w_radius"/>
    <stroke android:width="1dp" android:color="@color/w%s_line"/>
</shape>''' % (A, k, k))
    w('drawable/wbtn_%s.xml' % k, '''
<shape %s android:shape="oval">
    <solid android:color="@color/w%s_line"/>
</shape>''' % (A, k))
    w('drawable/wline_%s.xml' % k, '<shape %s android:shape="rectangle"><solid android:color="@color/w%s_line"/></shape>' % (A, k))
    for name, path in ICONS.items():
        w('drawable/wic_%s_%s.xml' % (name, k), '''
<vector %s android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="@color/w%s_text" android:pathData="%s"/>
</vector>''' % (A, k, path))
    w('drawable/wic_mark_%s.xml' % k, '''
<vector %s android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:strokeColor="@color/w%s_acc" android:strokeWidth="2.2" android:strokeLineCap="round" android:strokeLineJoin="round"
        android:fillColor="#00000000" android:pathData="M12,3 L12,21 M12,3 L15,3 A3.5,3.5 0 0 1 15,10 L12,10 M6.5,8.5 L17.5,18 M17.5,8.5 L6.5,18"/>
</vector>''' % (A, k))

# ---------- layouts ----------
LABEL = ('android:textColor="@color/wn_acc" android:textSize="10sp" android:letterSpacing="0.16" android:textStyle="bold" '
         'android:maxLines="1" android:ellipsize="end" android:includeFontPadding="false"')
SUB = 'android:textColor="@color/wn_sub"'
SERIF = 'android:textColor="@color/wn_text" android:fontFamily="serif" android:lineSpacingMultiplier="1.15" android:ellipsize="end"'


def header(label, meta, k='n'):
    return '''
        <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:gravity="center_vertical">
            <ImageView android:id="@+id/w_mark" android:layout_width="14dp" android:layout_height="14dp" android:src="@drawable/wic_mark_%s" android:importantForAccessibility="no"/>
            <TextView android:id="@+id/w_label" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1"
                android:layout_marginStart="6dp" android:text="%s" %s/>
            <TextView android:id="@+id/w_meta" android:layout_width="wrap_content" android:layout_height="wrap_content" android:layout_marginStart="8dp"
                android:text="%s" android:textSize="11sp" android:maxLines="1" %s/>
        </LinearLayout>''' % (k, label, LABEL, meta, SUB)


def main(label='CHURCH HISTORY', meta='', text='Tap to open.', orig='', by='', buttons=False, size=16, lines=8):
    return '''
<FrameLayout %s android:id="@android:id/background" android:layout_width="match_parent" android:layout_height="match_parent"
    android:background="@drawable/wbg_n" android:clipToOutline="true">
    <LinearLayout android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="16dp">%s
        <TextView android:id="@+id/w_text" android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1"
            android:layout_marginTop="10dp" android:text="%s" android:textSize="%dsp" android:maxLines="%d" %s/>
        <TextView android:id="@+id/w_orig" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="8dp"
            android:text="%s" android:textColor="@color/wn_acc2" android:textSize="15sp" android:fontFamily="serif" android:lineSpacingMultiplier="1.2"
            android:maxLines="3" android:ellipsize="end" android:textDirection="anyRtl" android:visibility="%s"/>
        <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="8dp"
            android:orientation="horizontal" android:gravity="center_vertical">
            <TextView android:id="@+id/w_by" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1"
                android:text="%s" android:textSize="12sp" android:maxLines="2" android:ellipsize="end" %s/>
            <ImageView android:id="@+id/w_share" android:layout_width="34dp" android:layout_height="34dp" android:layout_marginStart="8dp" android:padding="8dp"
                android:background="@drawable/wbtn_n" android:src="@drawable/wic_share_n" android:contentDescription="Share" android:visibility="%s"/>
            <ImageView android:id="@+id/w_next" android:layout_width="34dp" android:layout_height="34dp" android:layout_marginStart="8dp" android:padding="8dp"
                android:background="@drawable/wbtn_n" android:src="@drawable/wic_next_n" android:contentDescription="Next" android:visibility="%s"/>
        </LinearLayout>
    </LinearLayout>
</FrameLayout>''' % (A, header(label, meta), text, size, lines, SERIF, orig, 'visible' if orig else 'gone', by, SUB,
                     'visible' if buttons else 'gone', 'visible' if buttons else 'gone')


def compact(label='CHURCH HISTORY', text='Tap to open.'):
    return '''
<FrameLayout %s android:id="@android:id/background" android:layout_width="match_parent" android:layout_height="match_parent"
    android:background="@drawable/wbg_n" android:clipToOutline="true">
    <LinearLayout android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical"
        android:paddingStart="14dp" android:paddingEnd="14dp" android:paddingTop="10dp" android:paddingBottom="10dp" android:gravity="center_vertical">%s
        <TextView android:id="@+id/w_text" android:layout_width="match_parent" android:layout_height="wrap_content"
            android:layout_marginTop="4dp" android:text="%s" android:textSize="14sp" android:maxLines="3" %s/>
    </LinearLayout>
</FrameLayout>''' % (A, header(label, ''), text, SERIF)


def section(p, label, text, by, lines, top=True, orig=False):
    o = ('''
            <TextView android:id="@+id/%s_orig" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="4dp"
                android:textColor="@color/wn_acc2" android:textSize="14sp" android:fontFamily="serif" android:maxLines="2" android:ellipsize="end"
                android:textDirection="anyRtl" android:visibility="gone"/>''' % p) if orig else ''
    line = '''
        <FrameLayout android:id="@+id/%s_line" android:layout_width="match_parent" android:layout_height="1dp" android:layout_marginTop="12dp"
            android:layout_marginBottom="12dp" android:background="@drawable/wline_n"/>''' % p if top else ''
    return line + '''
        <LinearLayout android:id="@+id/%s" android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="vertical">
            <TextView android:id="@+id/%s_lbl" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="%s" %s/>
            <TextView android:id="@+id/%s_text" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="6dp"
                android:text="%s" android:textSize="15sp" android:maxLines="%d" %s/>%s
            <TextView android:id="@+id/%s_by" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="4dp"
                android:text="%s" android:textSize="11sp" android:maxLines="1" android:ellipsize="end" %s/>
        </LinearLayout>''' % (p, p, label, LABEL, p, text, lines, SERIF, o, p, by, SUB)


def today(sample=False):
    s = sample
    return '''
<FrameLayout %s android:id="@android:id/background" android:layout_width="match_parent" android:layout_height="match_parent"
    android:background="@drawable/wbg_n" android:clipToOutline="true">
    <LinearLayout android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="16dp">%s
        <TextView android:id="@+id/t_date" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="8dp"
            android:text="%s" android:textSize="22sp" android:maxLines="1" %s/>%s%s%s
    </LinearLayout>
</FrameLayout>''' % (A, header('TODAY', ''), 'Wednesday 19 November' if s else '', SERIF,
                     section('t_v', 'VERSE', 'The Lord is my shepherd; I shall not want.' if s else '', 'Psalm 23:1' if s else '', 4, orig=True),
                     section('t_q', 'FROM THE FATHERS', '“You have made us for yourself, and our heart is restless until it rests in you.”' if s else '',
                             'Augustine, Confessions' if s else '', 3),
                     section('t_o', 'ON THIS DAY', 'The Council of Nicaea opens.' if s else '', 'AD 325' if s else '', 2))


w('layout/w_main.xml', main())
w('layout/w_compact.xml', compact())
w('layout/w_today.xml', today())

PREVIEWS = {
    'quote': main('QUOTE OF THE DAY', 'c. 347–407', '“Do thou too then contend, even to the death, for the truth, and God will fight for thee!”',
                  by='— John Chrysostom, Homilies on the Statues', buttons=True),
    'verse': main('VERSE OF THE DAY', '', 'The Lord is my shepherd; I shall not want.', by='Psalm 23:1 · WEB', buttons=True),
    'verse_large': main('VERSE OF THE DAY', 'Hebrew', 'The Lord is my shepherd; I shall not want.', orig='יְהוָה רֹעִי לֹא אֶחְסָר',
                        by='Psalm 23:1 · WEB', buttons=True, size=19),
    'otd': main('ON THIS DAY', '20 MAY', 'The First Council of Nicaea opens, called by the emperor Constantine.', by='AD 325 · 1,701 years ago', buttons=True),
    'continue': main('CONTINUE READING', '', 'The Council of Nicaea', by='Episode 4 · Season 2', lines=3),
    'plan': main('TODAY’S READING', '', 'Councils in 14 days · day 3', by='Reading plan', lines=4),
    'today': today(True),
}
for k, s in PREVIEWS.items():
    w('layout/wp_%s.xml' % k, s)

# ---------- appwidget-provider files (configure + reconfigure from Android 12) ----------
INFO = {  # name: (minW, minH, cellsW, cellsH, initial, preview, description)
    'quote_widget_info': (250, 110, 4, 2, 'w_main', 'wp_quote', 'widget_desc'),
    'verse_widget_info': (250, 110, 4, 2, 'w_main', 'wp_verse', 'w_verse_desc'),
    'otd_widget_info': (250, 110, 4, 2, 'w_main', 'wp_otd', 'w_otd_desc'),
    'continue_widget_info': (180, 50, 3, 1, 'w_main', 'wp_continue', 'w_continue_desc'),
    'plan_widget_info': (250, 50, 4, 1, 'w_main', 'wp_plan', 'w_plan_desc'),
    'verse_large_widget_info': (250, 180, 4, 3, 'w_main', 'wp_verse_large', 'w_vbig_desc'),
    'today_widget_info': (250, 250, 4, 4, 'w_today', 'wp_today', 'w_today_desc'),
}
for name, (mw, mh, cw, ch, init, prev, desc) in INFO.items():
    base = '''android:minWidth="%ddp" android:minHeight="%ddp" android:minResizeWidth="110dp" android:minResizeHeight="40dp"
    android:targetCellWidth="%d" android:targetCellHeight="%d" android:updatePeriodMillis="10800000"
    android:initialLayout="@layout/%s" android:initialKeyguardLayout="@layout/%s" android:previewLayout="@layout/%s"
    android:resizeMode="horizontal|vertical" android:widgetCategory="home_screen|keyguard" android:description="@string/%s"''' % (
        mw, mh, cw, ch, init, init, prev, desc)
    w('xml/%s.xml' % name, '<appwidget-provider %s\n    %s/>' % (A, base))
    w('xml-v31/%s.xml' % name, '<appwidget-provider %s\n    %s\n    android:configure="org.hcc.history.WidgetConfig" android:widgetFeatures="reconfigurable|configuration_optional"/>' % (A, base))
print('widget resources written')
