/* Noor Fashion: shared organisation data with email accounts + admin approval (Firebase Auth + Firestore).
   Bundled by the build workflow into www/cloud.js */
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirestore, doc, collection, getDoc, setDoc, updateDoc, writeBatch, onSnapshot } from 'firebase/firestore';

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
const orgRef = () => doc(db, 'org', 'main');

let user = null, prof = null, isAdm = false, members = [], regName = '', regTitle = '', mode = 'login';
let unProf = null, unAdm = null, unMem = null, unOrg = null;
let timer = null, pendingTs = 0, busy = false, msg = '', syncMsg = '', modal = null, lockEl = null, lockKey = '', warned = false;

const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const localJSON = () => LS.getItem(KEY) || '';
function hasLocalData() {
  try {
    const d = JSON.parse(localJSON());
    return !!(d && ((d.w && d.w.length) || Object.keys(d.a || {}).length || (d.t || []).length || (d.i || []).length || (d.m || []).length));
  } catch (e) { return false; }
}
function state() {
  if (!user) return 'out';
  if (!prof) return 'loading';
  return prof.status === 'approved' ? 'ok' : prof.status === 'pending' ? 'pending' : 'rejected';
}
function errText(e) {
  const c = (e && e.code) || '';
  if (/invalid-credential|wrong-password|user-not-found/.test(c)) return 'ইমেইল বা পাসওয়ার্ড ভুল';
  if (/email-already-in-use/.test(c)) return 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে — লগইন করুন';
  if (/weak-password/.test(c)) return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
  if (/invalid-email/.test(c)) return 'ইমেইল সঠিক নয়';
  if (/network/.test(c)) return 'ইন্টারনেট সংযোগ নেই';
  if (/operation-not-allowed/.test(c)) return 'Firebase-এ Email/Password লগইন চালু নেই';
  if (/too-many/.test(c)) return 'অনেকবার চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন';
  if (/permission-denied/.test(c)) return 'অনুমতি নেই (Firestore Rules পাবলিশ হয়েছে কি?)';
  return 'সমস্যা: ' + (c || (e && e.message) || 'অজানা');
}

/* ---------- profile / approval ---------- */
async function ensureProfile(u) {
  const mref = doc(db, 'members', u.uid);
  const snap = await getDoc(mref);
  if (snap.exists()) return;
  const name = regName || (u.email || '').split('@')[0], title = regTitle || '';
  let booted = true;
  try { booted = (await getDoc(doc(db, 'config', 'bootstrap'))).exists(); } catch (e) { booted = true; }
  if (!booted) {
    // very first account becomes the admin
    try {
      const b = writeBatch(db), at = Date.now();
      b.set(doc(db, 'config', 'bootstrap'), { uid: u.uid, email: u.email, at });
      b.set(doc(db, 'admins', u.uid), { email: u.email, at });
      b.set(mref, { email: u.email, name, title, status: 'approved', role: 'admin', at });
      await b.commit();
      return;
    } catch (e) { /* someone else claimed it first: fall through */ }
  }
  await setDoc(mref, { email: u.email, name, title, status: 'pending', role: 'staff', at: Date.now() });
}
function subscribe(u) {
  unProf = onSnapshot(doc(db, 'members', u.uid), s => {
    prof = s.exists() ? s.data() : null;
    if (!s.exists()) ensureProfile(u).catch(e => { msg = errText(e); render(); });
    onStateChange(); render();
  }, e => { msg = errText(e); render(); });
  unAdm = onSnapshot(doc(db, 'admins', u.uid), s => {
    isAdm = s.exists();
    if (isAdm && !unMem) {
      unMem = onSnapshot(collection(db, 'members'), q => {
        members = q.docs.map(d => ({ id: d.id, ...d.data() }));
        const n = members.filter(m => m.status === 'pending').length;
        if (n && !warned && !modal && typeof toast === 'function') { warned = true; toast(bn(n) + ' জন অনুমোদনের অপেক্ষায় — মেনু → Cloud'); }
        render();
      }, () => {});
    }
    render();
  }, () => {});
}
function unsubscribeAll() {
  [unProf, unAdm, unMem, unOrg].forEach(f => f && f());
  unProf = unAdm = unMem = unOrg = null; prof = null; isAdm = false; members = []; warned = false;
}
function onStateChange() {
  if (state() === 'ok') { if (!unOrg) startSync(); }
  else if (unOrg) { unOrg(); unOrg = null; }
}

/* ---------- shared data sync (org/main) ---------- */
async function push() {
  if (state() !== 'ok' || busy || !navigator.onLine) return;
  busy = true;
  const json = localJSON(), ts = Date.now();
  pendingTs = ts;
  try {
    await setDoc(orgRef(), { json, ts, by: user.email });
    LS.setItem('nf_sync_ts', String(ts));
    if (localJSON() === json) LS.removeItem('nf_dirty');
    syncMsg = '';
  } catch (e) { syncMsg = 'সিঙ্ক ব্যর্থ: ' + errText(e); pendingTs = 0; }
  busy = false; render();
  if (LS.getItem('nf_dirty') === '1' && !syncMsg) schedule();
}
function schedule() { clearTimeout(timer); timer = setTimeout(push, 1500); }
function applyRemote(r) {
  try { LS.setItem('nf1_bak', localJSON()); } catch (e) {}
  LS.setItem(KEY, r.json); LS.setItem('nf_sync_ts', String(r.ts)); LS.removeItem('nf_dirty');
  location.reload();
}
function startSync() {
  unOrg = onSnapshot(orgRef(), snap => {
    if (snap.metadata.hasPendingWrites) return;
    const dirty = LS.getItem('nf_dirty') === '1';
    if (!snap.exists()) { if (hasLocalData()) push(); render(); return; }
    const r = snap.data();
    if (!r || typeof r.json !== 'string' || r.ts === pendingTs) return;
    const synced = +LS.getItem('nf_sync_ts') || 0;
    if (r.json === localJSON()) { LS.setItem('nf_sync_ts', String(r.ts)); LS.removeItem('nf_dirty'); render(); return; }
    if (r.ts > synced) {
      const clash = dirty || (synced === 0 && hasLocalData());
      if (!clash) return applyRemote(r);
      if (confirm('এই ফোনের ডেটা আর প্রতিষ্ঠানের শেয়ার্ড ডেটা আলাদা।\n\nOK = প্রতিষ্ঠানের ডেটা নিন (এই ফোনের ডেটার ব্যাকআপ থাকবে)\nCancel = এই ফোনের ডেটা দিয়ে প্রতিষ্ঠানের ডেটা বদলান')) applyRemote(r);
      else push();
    } else if (dirty) push();
    render();
  }, e => { syncMsg = 'সংযোগ হয়নি: ' + errText(e); render(); });
}
function syncLine() {
  if (syncMsg) return syncMsg;
  if (LS.getItem('nf_dirty') === '1') return 'ক্লাউডে পাঠানো বাকি আছে…';
  const t = +LS.getItem('nf_sync_ts') || 0;
  return t ? 'শেষ সিঙ্ক: ' + bn(new Date(t).toLocaleString('bn-BD')) : 'সিঙ্ক হয়নি';
}

/* ---------- UI ---------- */
const css = `.nfc,.nfl{position:fixed;inset:0;z-index:99999;display:flex;font-family:'NF','Noto Sans Bengali',sans-serif;visibility:visible}
.nfc{background:rgba(0,0,0,.55);align-items:flex-end;justify-content:center}
.nfl{background:var(--bg,#f2f2f2);align-items:center;justify-content:center;padding:18px;overflow:auto}
.nfc .cd,.nfl .cd{width:100%;max-width:440px;background:var(--c,#fff);color:var(--t,#111);padding:20px 18px;box-sizing:border-box}
.nfc .cd{border-radius:20px 20px 0 0;max-height:88vh;overflow:auto;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px))}
.nfl .cd{border-radius:20px;box-shadow:var(--sh,0 2px 6px rgba(0,0,0,.08))}
.cd h3{margin:0 0 4px;font-size:20px}.cd p{margin:0 0 12px;font-size:13px;color:var(--m,#6b6b6b);line-height:1.55}
.cd input{width:100%;box-sizing:border-box;margin:0 0 10px;padding:13px 14px;border:1.5px solid var(--l,#e3e3e3);border-radius:12px;background:var(--in,#f4f4f4);color:var(--t,#111);font-size:16px}
.cd button{border:1.5px solid var(--t,#111);background:transparent;color:var(--t,#111);border-radius:999px;padding:10px 16px;font:700 14px 'NF','Noto Sans Bengali',sans-serif;margin:0 8px 8px 0}
.cd button.pr{background:var(--pr,#111);color:var(--pt,#fff)}
.cd .er{color:var(--no,#c8414f);font-size:13px;min-height:18px;margin:0 0 8px}
.cd a{color:var(--m,#6b6b6b);font-size:13px;text-decoration:underline;display:inline-block;margin-top:4px}
.cd .tabs{display:flex;gap:8px;margin-bottom:14px}.cd .tabs button{flex:1;margin:0}
.cd .mr{display:flex;align-items:center;gap:8px;padding:10px 0;border-top:1px solid var(--l,#e3e3e3)}
.cd .mr div{flex:1;min-width:0;font-size:13px}.cd .mr b{display:block;font-size:14px;overflow:hidden;text-overflow:ellipsis}
.cd .mr button{margin:0;padding:6px 12px;font-size:12px}
.cd .bd{font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid var(--g2,#bdbdbd);color:var(--m,#6b6b6b)}
.cd h4{margin:14px 0 2px;font-size:14px}`;
function ensureCss() {
  if (document.getElementById('nfcss')) return;
  const st = document.createElement('style'); st.id = 'nfcss'; st.textContent = css; document.head.appendChild(st);
}
function setLock(on) { document.documentElement.classList.toggle('nflock', on); }

function lockRender() {
  const st = state();
  const optimistic = user && LS.getItem('nf_ok') === user.uid && st === 'loading';
  if (st === 'ok' || optimistic) {
    if (st === 'ok') LS.setItem('nf_ok', user.uid);
    if (lockEl) { lockEl.remove(); lockEl = null; lockKey = ''; }
    setLock(false); return;
  }
  if (!user || st === 'rejected') LS.removeItem('nf_ok');
  setLock(true); ensureCss();
  const key = st + '|' + mode + '|' + msg + '|' + (user ? user.uid : '');
  if (lockEl && key === lockKey) return;
  lockKey = key;
  if (!lockEl) { lockEl = document.createElement('div'); lockEl.className = 'nfl'; lockEl.innerHTML = '<div class="cd"></div>'; document.body.appendChild(lockEl); }
  const cd = lockEl.querySelector('.cd');
  const er = `<div class="er" id="nfe">${esc(msg)}</div>`;
  if (st === 'out') {
    const reg = mode === 'register';
    cd.innerHTML = `<h3>Noor Fashion</h3><p>প্রতিষ্ঠানের অ্যাপ — প্রবেশ করতে লগইন করুন। নতুন অ্যাকাউন্ট অ্যাডমিনের অনুমোদনের পর চালু হবে।</p>
      <div class="tabs"><button class="${reg ? '' : 'pr'}" id="nft1">লগইন</button><button class="${reg ? 'pr' : ''}" id="nft2">নতুন অ্যাকাউন্ট</button></div>
      ${reg ? '<input id="nfn" placeholder="আপনার নাম" autocomplete="name"><input id="nfd" placeholder="পদবী (যেমন: ম্যানেজার, সুপারভাইজার)">' : ''}
      <input id="nfm" type="email" placeholder="ইমেইল" autocomplete="username"><input id="nfp" type="password" placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" autocomplete="${reg ? 'new-password' : 'current-password'}">${er}
      <button class="pr" id="nfgo">${reg ? 'অ্যাকাউন্ট খুলুন' : 'লগইন'}</button>${reg ? '' : '<br><a id="nff">পাসওয়ার্ড ভুলে গেছেন?</a>'}`;
    cd.querySelector('#nft1').onclick = () => { mode = 'login'; msg = ''; render(); };
    cd.querySelector('#nft2').onclick = () => { mode = 'register'; msg = ''; render(); };
    const e = () => cd.querySelector('#nfe');
    cd.querySelector('#nfgo').onclick = async () => {
      const m = cd.querySelector('#nfm').value.trim(), p = cd.querySelector('#nfp').value;
      const n = reg ? cd.querySelector('#nfn').value.trim() : '', t = reg ? cd.querySelector('#nfd').value.trim() : '';
      if (!m || !p || (reg && (!n || !t))) { e().textContent = reg ? 'নাম, পদবী, ইমেইল ও পাসওয়ার্ড দিন' : 'ইমেইল ও পাসওয়ার্ড দিন'; return; }
      e().textContent = 'অপেক্ষা করুন…';
      try { if (reg) { regName = n; regTitle = t; await createUserWithEmailAndPassword(auth, m, p); } else await signInWithEmailAndPassword(auth, m, p); msg = ''; }
      catch (x) { msg = errText(x); lockKey = ''; render(); }
    };
    const f = cd.querySelector('#nff');
    if (f) f.onclick = async () => {
      const m = cd.querySelector('#nfm').value.trim();
      if (!m) { e().textContent = 'আগে ইমেইল লিখুন'; return; }
      try { await sendPasswordResetEmail(auth, m); e().textContent = 'পাসওয়ার্ড রিসেটের ইমেইল পাঠানো হয়েছে'; } catch (x) { e().textContent = errText(x); }
    };
  } else {
    const title = st === 'pending' ? '⏳ অনুমোদনের অপেক্ষায়' : st === 'rejected' ? '⛔ প্রবেশের অনুমতি নেই' : 'যাচাই হচ্ছে…';
    const body = st === 'pending' ? 'আপনার অ্যাকাউন্ট খোলা হয়েছে। অ্যাডমিন অনুমোদন দিলে অ্যাপ চালু হবে। অনুমোদনের পর এই পাতা নিজে থেকেই খুলে যাবে।'
      : st === 'rejected' ? 'অ্যাডমিন এই অ্যাকাউন্টে প্রবেশ বন্ধ রেখেছেন। প্রয়োজনে অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'একটু অপেক্ষা করুন…';
    cd.innerHTML = `<h3>${title}</h3><p>${esc(user.email)}<br>${body}</p>${er}<button id="nfo">লগআউট</button>`;
    cd.querySelector('#nfo').onclick = () => signOut(auth);
  }
}

function modalRender() {
  if (!modal) return;
  const cd = modal.querySelector('.cd');
  if (state() !== 'ok') { modal.remove(); modal = null; return; }
  const pend = members.filter(m => m.status === 'pending'), rest = members.filter(m => m.status !== 'pending').sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const row = m => `<div class="mr"><div><b>${esc(m.name || m.email)}${m.title ? ' — ' + esc(m.title) : ''}</b>${esc(m.email)} <span class="bd">${m.status === 'approved' ? 'চালু' : m.status === 'pending' ? 'অপেক্ষায়' : 'বন্ধ'}</span></div>
    ${m.id === user.uid ? '' : (m.status !== 'approved' ? `<button class="pr" data-ap="${m.id}">অনুমোদন</button>` : '') + (m.status !== 'rejected' ? `<button data-rj="${m.id}">${m.status === 'pending' ? 'বাতিল' : 'বন্ধ করুন'}</button>` : '')}</div>`;
  cd.innerHTML = `<h3>☁️ ক্লাউড সিঙ্ক চালু</h3><p>${prof && prof.name ? esc(prof.name) + (prof.title ? ' — ' + esc(prof.title) : '') + '<br>' : ''}${esc(user.email)}${isAdm ? ' · <b>অ্যাডমিন</b>' : ''}<br>${esc(syncLine())}</p>
    <button class="pr" id="nfs">এখনই সিঙ্ক করুন</button><button id="nfo">লগআউট</button><button id="nfx">বন্ধ</button>
    ${isAdm ? `<h4>অ্যাকাউন্ট অনুমোদন${pend.length ? ' (' + bn(pend.length) + ' জন অপেক্ষায়)' : ''}</h4>${pend.map(row).join('')}${rest.map(row).join('') || ''}` : ''}`;
  cd.querySelector('#nfs').onclick = () => { LS.setItem('nf_dirty', '1'); push(); };
  cd.querySelector('#nfo').onclick = () => { close(); signOut(auth); };
  cd.querySelector('#nfx').onclick = close;
  cd.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => decide(b.dataset.ap, 'approved'));
  cd.querySelectorAll('[data-rj]').forEach(b => b.onclick = () => decide(b.dataset.rj, 'rejected'));
}
async function decide(id, status) {
  try { await updateDoc(doc(db, 'members', id), { status, decidedAt: Date.now(), decidedBy: user.email }); }
  catch (e) { syncMsg = errText(e); render(); }
}
function render() { lockRender(); modalRender(); }
function open() {
  if (modal || state() !== 'ok') return;
  ensureCss();
  modal = document.createElement('div'); modal.className = 'nfc'; modal.innerHTML = '<div class="cd"></div>';
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.body.appendChild(modal); render();
}
function close() { if (modal) { modal.remove(); modal = null; } }

onAuthStateChanged(auth, u => {
  unsubscribeAll(); user = u; msg = ''; syncMsg = '';
  if (u) subscribe(u);
  render();
});
window.addEventListener('online', () => { if (state() === 'ok' && LS.getItem('nf_dirty') === '1') schedule(); });
window.NFC = { open, dirty() { LS.setItem('nf_dirty', '1'); if (state() === 'ok') schedule(); } };
render();
