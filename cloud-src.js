/* Noor Fashion cloud sync (Firebase Auth + Firestore). Bundled by the build workflow into www/cloud.js */
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const cfg = {
  apiKey: 'AIzaSyDJmVnJVChTZDV-OzOcGkLXvRG4kTu0ZJQ',
  authDomain: 'noor-fashion-9fb4f.firebaseapp.com',
  projectId: 'noor-fashion-9fb4f',
  storageBucket: 'noor-fashion-9fb4f.firebasestorage.app',
  messagingSenderId: '678678254442',
  appId: '1:678678254442:android:3e5eb37360814b944e4b13'
};

const LS = window.localStorage, KEY = 'nf1';
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

let user = null, unsub = null, timer = null, pendingTs = 0, busy = false, msg = '';

const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const localJSON = () => LS.getItem(KEY) || '';
function hasLocalData() {
  try {
    const d = JSON.parse(localJSON());
    return !!(d && ((d.w && d.w.length) || Object.keys(d.a || {}).length || (d.t || []).length || (d.i || []).length || (d.m || []).length));
  } catch (e) { return false; }
}
const ref = () => doc(db, 'users', user.uid);

function statusLine() {
  if (!user) return 'লগইন করা নেই — ডেটা শুধু এই ফোনে আছে';
  if (msg) return msg;
  const t = +LS.getItem('nf_sync_ts') || 0;
  const dirty = LS.getItem('nf_dirty') === '1';
  if (dirty) return 'ক্লাউডে পাঠানো বাকি আছে…';
  return t ? 'শেষ সিঙ্ক: ' + bn(new Date(t).toLocaleString('bn-BD')) : 'সিঙ্ক হয়নি';
}

async function push() {
  if (!user || busy || !navigator.onLine) return;
  busy = true;
  const json = localJSON(), ts = Date.now();
  pendingTs = ts;
  try {
    await setDoc(ref(), { json, ts, dev: (navigator.userAgent || '').slice(0, 80) });
    LS.setItem('nf_sync_ts', String(ts));
    if (localJSON() === json) LS.removeItem('nf_dirty');
    msg = '';
  } catch (e) {
    msg = 'সিঙ্ক ব্যর্থ: ' + (e.code || e.message);
    pendingTs = 0;
  }
  busy = false;
  render();
  if (LS.getItem('nf_dirty') === '1' && !msg) schedule();
}
function schedule() { clearTimeout(timer); timer = setTimeout(push, 1500); }

function applyRemote(r) {
  try { LS.setItem('nf1_bak', localJSON()); } catch (e) {}
  LS.setItem(KEY, r.json);
  LS.setItem('nf_sync_ts', String(r.ts));
  LS.removeItem('nf_dirty');
  location.reload();
}

function onRemote(snap) {
  if (snap.metadata.hasPendingWrites) return;
  const dirty = LS.getItem('nf_dirty') === '1';
  if (!snap.exists()) { if (hasLocalData()) push(); render(); return; }
  const r = snap.data();
  if (!r || typeof r.json !== 'string') return;
  if (r.ts === pendingTs) return;
  const synced = +LS.getItem('nf_sync_ts') || 0;
  if (r.json === localJSON()) { LS.setItem('nf_sync_ts', String(r.ts)); LS.removeItem('nf_dirty'); render(); return; }
  if (r.ts > synced) {
    const clash = dirty || (synced === 0 && hasLocalData());
    if (!clash) return applyRemote(r);
    if (confirm('এই ফোনের ডেটা আর ক্লাউডের ডেটা আলাদা।\n\nOK = ক্লাউডের ডেটা নিন (এই ফোনের ডেটার ব্যাকআপ থাকবে)\nCancel = এই ফোনের ডেটা ক্লাউডে পাঠান')) applyRemote(r);
    else push();
  } else if (dirty) push();
  render();
}

/* ---------- UI ---------- */
let box = null;
const css = `.nfc{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}
.nfc .cd{width:100%;max-width:480px;background:var(--c,#fff);color:var(--t,#111);border-radius:20px 20px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));font-family:'NF','Noto Sans Bengali',sans-serif}
.nfc h3{margin:0 0 4px;font-size:19px}.nfc p{margin:0 0 12px;font-size:13px;color:var(--m,#6b6b6b);line-height:1.5}
.nfc input{width:100%;box-sizing:border-box;margin:0 0 10px;padding:13px 14px;border:1.5px solid var(--l,#e3e3e3);border-radius:12px;background:var(--in,#f4f4f4);color:var(--t,#111);font-size:16px}
.nfc button{border:1.5px solid var(--t,#111);background:transparent;color:var(--t,#111);border-radius:999px;padding:11px 18px;font:700 14px 'NF','Noto Sans Bengali',sans-serif;margin:0 8px 8px 0}
.nfc button.pr{background:var(--pr,#111);color:var(--pt,#fff)}
.nfc .er{color:var(--no,#c8414f);font-size:13px;min-height:18px;margin:0 0 8px}
.nfc a{color:var(--m,#6b6b6b);font-size:13px;text-decoration:underline;display:inline-block;margin-top:4px}`;
function errText(e) {
  const c = (e && e.code) || '';
  if (/invalid-credential|wrong-password|user-not-found/.test(c)) return 'ইমেইল বা পাসওয়ার্ড ভুল';
  if (/email-already-in-use/.test(c)) return 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে — লগইন করুন';
  if (/weak-password/.test(c)) return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
  if (/invalid-email/.test(c)) return 'ইমেইল সঠিক নয়';
  if (/network/.test(c)) return 'ইন্টারনেট সংযোগ নেই';
  if (/operation-not-allowed/.test(c)) return 'Firebase-এ Email/Password লগইন চালু নেই';
  if (/too-many/.test(c)) return 'অনেকবার চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন';
  return 'সমস্যা: ' + (c || (e && e.message) || 'অজানা');
}
function render() {
  if (!box) return;
  const cd = box.querySelector('.cd');
  const er = (s) => `<div class="er" id="nfe">${s || ''}</div>`;
  if (user) {
    cd.innerHTML = `<h3>☁️ ক্লাউড সিঙ্ক চালু</h3><p>${user.email}<br>${statusLine()}</p>${er()}
      <button class="pr" id="nfs">এখনই সিঙ্ক করুন</button><button id="nfo">লগআউট</button><button id="nfx">বন্ধ</button>`;
    cd.querySelector('#nfs').onclick = () => { LS.setItem('nf_dirty', '1'); push(); };
    cd.querySelector('#nfo').onclick = async () => { await signOut(auth); };
  } else {
    cd.innerHTML = `<h3>☁️ ক্লাউড সিঙ্ক</h3><p>লগইন করলে ডেটা ক্লাউডে সেভ হবে এবং অন্য ফোনেও একই অ্যাকাউন্টে পাবেন।</p>
      <input id="nfm" type="email" placeholder="ইমেইল" autocomplete="username"><input id="nfp" type="password" placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" autocomplete="current-password">${er()}
      <button class="pr" id="nfl">লগইন</button><button id="nfr">নতুন অ্যাকাউন্ট</button><button id="nfx">বন্ধ</button><br><a id="nff">পাসওয়ার্ড ভুলে গেছেন?</a>`;
    const val = () => [cd.querySelector('#nfm').value.trim(), cd.querySelector('#nfp').value];
    const run = async (fn) => {
      const [m, p] = val(); const e = cd.querySelector('#nfe');
      if (!m || !p) { e.textContent = 'ইমেইল ও পাসওয়ার্ড দিন'; return; }
      e.textContent = 'অপেক্ষা করুন…';
      try { await fn(auth, m, p); } catch (x) { e.textContent = errText(x); }
    };
    cd.querySelector('#nfl').onclick = () => run(signInWithEmailAndPassword);
    cd.querySelector('#nfr').onclick = () => run(createUserWithEmailAndPassword);
    cd.querySelector('#nff').onclick = async () => {
      const m = cd.querySelector('#nfm').value.trim(), e = cd.querySelector('#nfe');
      if (!m) { e.textContent = 'আগে ইমেইল লিখুন'; return; }
      try { await sendPasswordResetEmail(auth, m); e.textContent = 'পাসওয়ার্ড রিসেটের ইমেইল পাঠানো হয়েছে'; } catch (x) { e.textContent = errText(x); }
    };
  }
  cd.querySelector('#nfx').onclick = close;
}
function open() {
  if (box) return;
  const st = document.createElement('style'); st.textContent = css; st.id = 'nfcss';
  if (!document.getElementById('nfcss')) document.head.appendChild(st);
  box = document.createElement('div'); box.className = 'nfc'; box.innerHTML = '<div class="cd"></div>';
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.body.appendChild(box); render();
}
function close() { if (box) { box.remove(); box = null; } }

onAuthStateChanged(auth, u => {
  user = u; msg = '';
  if (unsub) { unsub(); unsub = null; }
  if (u) { unsub = onSnapshot(ref(), { includeMetadataChanges: true }, onRemote, e => { msg = 'ক্লাউডে সংযোগ হয়নি: ' + (e.code || e.message); render(); }); }
  render();
});
window.addEventListener('online', () => { if (user && LS.getItem('nf_dirty') === '1') schedule(); });
window.NFC = { open, dirty() { LS.setItem('nf_dirty', '1'); if (user) schedule(); } };
