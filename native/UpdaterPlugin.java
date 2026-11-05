package com.noorfashion.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NoorUpdater")
public class UpdaterPlugin extends Plugin {

    private boolean canInstall() {
        return Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls();
    }

    @Override
    protected void handleOnResume() {
        Updater.fg = true;
        Updater.onInstallFail = new Runnable() {
            public void run() { notifyListeners("fail", new JSObject()); }
        };
    }

    @Override
    protected void handleOnPause() {
        Updater.fg = false;
    }

    @PluginMethod
    public void check(final PluginCall call) {
        new Thread(new Runnable() {
            public void run() {
                Updater.Info i = Updater.checkNow(getContext().getApplicationContext());
                JSObject o = new JSObject();
                o.put("cur", Updater.curVer(getContext()));
                o.put("can", canInstall());
                if (i != null) { o.put("v", i.v); o.put("url", i.url); }
                call.resolve(o);
            }
        }).start();
    }

    @PluginMethod
    public void install(final PluginCall call) {
        final String url = call.getString("url");
        JSObject res = new JSObject();
        if (url == null) { call.reject("no url"); return; }
        if (!canInstall()) {
            res.put("needPerm", true);
            try {
                Intent it = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
                it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(it);
            } catch (Exception e) { }
            call.resolve(res);
            return;
        }
        Updater.sp(getContext()).edit().putBoolean("reopen", true).apply();
        call.resolve(res);
        final android.content.Context app = getContext().getApplicationContext();
        new Thread(new Runnable() {
            public void run() {
                try {
                    Updater.installNow(app, url, new Updater.Pct() {
                        public void on(int p) {
                            JSObject o = new JSObject();
                            o.put("pct", p);
                            notifyListeners("prog", o);
                        }
                    }, new Runnable() {
                        public void run() { notifyListeners("commit", new JSObject()); }
                    });
                } catch (Exception e) {
                    JSObject o = new JSObject();
                    o.put("msg", String.valueOf(e.getMessage()));
                    notifyListeners("fail", o);
                }
            }
        }).start();
    }
}
