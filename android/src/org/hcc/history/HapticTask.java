package org.hcc.history;

class HapticTask implements Runnable {
    final MainActivity act; final int kind;
    HapticTask(MainActivity a, int k) { act = a; kind = k; }
    public void run() { if (act.web != null) act.web.performHapticFeedback(kind); }
}
