package com.noorfashion.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.widget.Toast;

// PackageInstaller-এর ফল এখানে আসে; নিশ্চিত করার পর্দা দরকার হলে সেটা খোলে
public class UpdateReceiver extends BroadcastReceiver {
    @Override
    @SuppressWarnings("deprecation")
    public void onReceive(Context c, Intent i) {
        int st = i.getIntExtra(PackageInstaller.EXTRA_STATUS, -1);
        if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent ui = (Intent) i.getParcelableExtra(Intent.EXTRA_INTENT);
            if (ui != null) {
                ui.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (Updater.fg) {
                    try { c.startActivity(ui); } catch (Exception e) {
                        Toast.makeText(c, "নিশ্চিত করার পর্দা খুলল না — আবার Update চাপুন", Toast.LENGTH_LONG).show();
                    }
                } else {
                    Updater.confirmNotice(c, ui);
                }
            }
        } else if (st == PackageInstaller.STATUS_SUCCESS) {
            // ইনস্টল শেষ
        } else {
            String msg = i.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            if (msg == null) msg = "";
            Runnable r = Updater.onInstallFail;
            if (r != null) { try { r.run(); } catch (Exception e) { } }
            if (Updater.fg) Toast.makeText(c, "আপডেট হয়নি: " + msg, Toast.LENGTH_LONG).show();
            Updater.notice(c, 9, "আপডেট হয়নি", msg, null);
        }
    }
}
