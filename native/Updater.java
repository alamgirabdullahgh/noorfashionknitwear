package com.noorfashion.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInstaller;
import android.os.Build;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// AutoReply-এর Updater.kt-এর হুবহু ধারা: GitHub "latest release" লিংক দেখে নতুন সংস্করণ ধরে,
// APK নামিয়ে PackageInstaller-এ জমা দেয়
public class Updater {
    public static final String REPO = "alamgirabdullahgh/noorfashionknitwear";
    public static volatile boolean fg = false;
    public static volatile Runnable onInstallFail = null;

    public static class Info {
        public final int v;
        public final String url;
        Info(int v, String url) { this.v = v; this.url = url; }
    }

    public interface Pct { void on(int p); }

    static SharedPreferences sp(Context c) { return c.getSharedPreferences("noor_upd", Context.MODE_PRIVATE); }

    @SuppressWarnings("deprecation")
    public static int curVer(Context c) {
        try { return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionCode; } catch (Exception e) { return 0; }
    }

    // "latest release" লিংক কোন ট্যাগে যায় সেটা দেখে (API নয়, তাই রেট লিমিট নেই); ট্যাগের শেষ সংখ্যাই সংস্করণ (v1.0.N)
    private static Info fetch() throws Exception {
        HttpURLConnection cn = (HttpURLConnection) new URL("https://github.com/" + REPO + "/releases/latest").openConnection();
        try {
            cn.setInstanceFollowRedirects(false);
            cn.setConnectTimeout(10000);
            cn.setReadTimeout(10000);
            String loc = cn.getHeaderField("Location");
            if (loc == null) throw new Exception("no release");
            String tag = loc.substring(loc.lastIndexOf('/') + 1);
            String last = tag.substring(tag.lastIndexOf('.') + 1).replaceAll("\\D", "");
            int v = Integer.parseInt(last);
            return new Info(v, "https://github.com/" + REPO + "/releases/download/" + tag + "/NoorFashion.apk");
        } finally {
            cn.disconnect();
        }
    }

    public static Info saved(Context c) {
        SharedPreferences sp = sp(c);
        int v = sp.getInt("upd_v", 0);
        String u = sp.getString("upd_u", null);
        return (u != null && v > curVer(c)) ? new Info(v, u) : null;
    }

    public static Info checkNow(Context c) {
        try {
            Info i = fetch();
            sp(c).edit().putInt("upd_v", i.v).putString("upd_u", i.url).putLong("upd_t", System.currentTimeMillis()).apply();
        } catch (Exception e) { }
        return saved(c);
    }

    // APK নামিয়ে PackageInstaller-এ জমা দেয়; ব্যর্থ হলে ব্যতিক্রম ছোঁড়ে
    public static void installNow(Context c, String url, Pct onPct, Runnable onCommit) throws Exception {
        PackageInstaller inst = c.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams p = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        if (Build.VERSION.SDK_INT >= 31) p.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED);
        int id = inst.createSession(p);
        try {
            PackageInstaller.Session s = inst.openSession(id);
            HttpURLConnection cn = (HttpURLConnection) new URL(url).openConnection();
            try {
                cn.setConnectTimeout(15000);
                cn.setReadTimeout(30000);
                if (cn.getResponseCode() != 200) throw new Exception("HTTP " + cn.getResponseCode());
                long total = cn.getContentLengthLong();
                InputStream ins = cn.getInputStream();
                OutputStream out = s.openWrite("a", 0, -1);
                byte[] buf = new byte[32 * 1024];
                long done = 0;
                int last = -1;
                while (true) {
                    int n = ins.read(buf);
                    if (n < 0) break;
                    out.write(buf, 0, n);
                    done += n;
                    if (total > 0) {
                        int pct = (int) Math.max(0, Math.min(100, done * 100 / total));
                        if (pct != last) { last = pct; onPct.on(pct); }
                    }
                }
                s.fsync(out);
                out.close();
                ins.close();
            } finally {
                cn.disconnect();
            }
            int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
            PendingIntent pi = PendingIntent.getBroadcast(c, id, new Intent(c, UpdateReceiver.class), fl);
            onCommit.run();
            s.commit(pi.getIntentSender());
        } catch (Exception e) {
            try { inst.abandonSession(id); } catch (Exception x) { }
            throw e;
        }
    }

    static void notice(Context c, int id, String title, String text, PendingIntent pi) {
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= 26) {
                nm.createNotificationChannel(new NotificationChannel("update", "Noor Fashion আপডেট", NotificationManager.IMPORTANCE_DEFAULT));
                b = new Notification.Builder(c, "update");
            } else {
                b = new Notification.Builder(c);
            }
            b.setSmallIcon(android.R.drawable.stat_sys_download_done).setContentTitle(title).setContentText(text).setAutoCancel(true);
            if (pi != null) b.setContentIntent(pi);
            nm.notify(id, b.build());
        } catch (Exception e) { }
    }

    // ব্যাকগ্রাউন্ডে নিশ্চিত করার পর্দা খোলা যায় না, তাই নোটিফিকেশনে চাপলে সেটি খোলে
    public static void confirmNotice(Context c, Intent ui) {
        PendingIntent pi = PendingIntent.getActivity(c, 12, ui, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        notice(c, 12, "Noor Fashion-এর নতুন সংস্করণ তৈরি", "চাপুন — ইনস্টল নিশ্চিত করুন", pi);
    }
}
