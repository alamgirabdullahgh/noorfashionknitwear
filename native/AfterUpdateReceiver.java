package com.noorfashion.app;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// আপডেটের পর নতুন সংস্করণ চালু হলে (MY_PACKAGE_REPLACED): অ্যাপ আবার খোলার চেষ্টা, না পারলে চাপলেই খোলে এমন নোটিফিকেশন
public class AfterUpdateReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        if (!Updater.sp(c).getBoolean("reopen", false)) return;
        Updater.sp(c).edit().remove("reopen").apply();
        Intent go = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        try { c.startActivity(go); } catch (Exception e) { }
        PendingIntent pi = PendingIntent.getActivity(c, 13, go, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Updater.notice(c, 13, "Noor Fashion আপডেট হয়েছে", "অ্যাপ খুলতে চাপুন", pi);
    }
}
