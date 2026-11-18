package org.hcc.history;

class AskTask implements Runnable {
    final MainActivity act;
    AskTask(MainActivity a) { act = a; }
    public void run() { if (android.os.Build.VERSION.SDK_INT >= 23) act.requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7); }
}
