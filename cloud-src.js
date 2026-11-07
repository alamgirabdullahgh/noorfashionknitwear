/* Noor Fashion: shared organisation data with email accounts + admin approval (Firebase Auth + Firestore).
   Bundled by the build workflow into www/cloud.js */
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateEmail, verifyBeforeUpdateEmail, deleteUser } from 'firebase/auth';
import { initializeFirestore, doc, collection, getDoc, setDoc, updateDoc, writeBatch, onSnapshot, deleteDoc } from 'firebase/firestore';

const cfg = {
  apiKey: 'AIzaSyDJmVnJVChTZDV-OzOcGkLXvRG4kTu0ZJQ',
  authDomain: 'noor-fashion-9fb4f.firebaseapp.com',
  projectId: 'noor-fashion-9fb4f',
  storageBucket: 'noor-fashion-9fb4f.firebasestorage.app',
  messagingSenderId: '678678254442',
  appId: '1:678678254442:android:3e5eb37360814b944e4b13'
};
const ADDR = {
  Dhaka: {
    Dhaka: ["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar"],
    Gazipur: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
    Narayanganj: ["Araihazar", "Sonargaon", "Narayanganj Sadar", "Rupganj", "Bandar"],
    Tangail: ["Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar"],
    Faridpur: ["Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Faridpur Sadar", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
    Manikganj: ["Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar", "Saturia", "Shibalaya", "Singair"],
    Munshiganj: ["Gazaria", "Louhajang", "Munshiganj Sadar", "Sirajdikhan", "Sreenagar", "Tongibari"],
    Narsingdi: ["Belabo", "Monohardi", "Narsingdi Sadar", "Palash", "Raipura", "Shibpur"],
    Gopalganj: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
    Madaripur: ["Kalkini", "Madaripur Sadar", "Rajoir", "Shibchar", "Dasar"],
    Rajbari: ["Baliakandi", "Goalanda", "Kalukhali", "Pangsha", "Rajbari Sadar"],
    Shariatpur: ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar", "Zajira"],
    Kishoreganj: ["Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Mithamoin", "Nikli", "Pakundia", "Tarail"]
  },
  Chattogram: {
    Chattogram: ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda", "Karnafuli"],
    "Coxs Bazar": ["Chakaria", "Coxs Bazar Sadar", "Kutubdia", "Moheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhiya", "Eidgaon"],
    Cumilla: ["Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Sadar South", "Comilla Adarsha Sadar", "Daudkandi", "Debidwar", "Homna", "Laksam", "Monohorganj", "Meghna", "Muradnagar", "Nangalkot", "Titas", "Lalmai"],
    Feni: ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Fulgazi", "Parshuram", "Sonagazi"],
    Brahmanbaria: ["Akhaura", "Bancharampur", "Bijoynagar", "Brahmanbaria Sadar", "Ashuganj", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"],
    Noakhali: ["Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Senbagh", "Sonaimuri", "Subarnachar", "Noakhali Sadar", "Kabirhat"],
    Lakshmipur: ["Kamalnagar", "Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Chandraganj"],
    Chandpur: ["Chandpur Sadar", "Faridganj", "Haimchar", "Hajiganj", "Kachua", "Matlab South", "Matlab North", "Shahrasti"],
    Rangamati: ["Baghaichhari", "Barkal", "Kawkhali", "Kaptai", "Juraichhari", "Langadu", "Naniarchar", "Rangamati Sadar", "Rajasthali", "Belaichhari"],
    Khagrachhari: ["Dighinala", "Manikchhari", "Khagrachhari Sadar", "Laxmichhari", "Mahalchhari", "Matiranga", "Panchhari", "Ramgarh", "Guimara"],
    Bandarban: ["Alikadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"]
  },
  Rajshahi: {
    Rajshahi: ["Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohonpur", "Paba", "Puthia", "Tanore"],
    Bogra: ["Adamdighi", "Bogra Sadar", "Dhunat", "Dupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatala", "Mokamtala"],
    Pabna: ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishurdi", "Pabna Sadar", "Santhia", "Sujanagar"],
    Naogaon: ["Atrai", "Dhamoirhat", "Manda", "Mohadevpur", "Naogaon Sadar", "Niamatpur", "Patnitala", "Raninagar", "Sapahar", "Badalgachhi", "Porsha"],
    Sirajganj: ["Belkuchi", "Chauhali", "Kamarkhand", "Kazipur", "Raiganj", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullapara"],
    Natore: ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Natore Sadar", "Singra", "Naldanga"],
    "Chapai Nawabganj": ["Shibganj", "Bholahat", "Gomastapur", "Nachol", "Chapai Nawabganj Sadar"],
    Joypurhat: ["Akkelpur", "Joypurhat Sadar", "Kalai", "Panchbibi", "Khetlal"]
  },
  Khulna: {
    Khulna: ["Batiaghata", "Dacope", "Dumuria", "Koyra", "Paikgachha", "Phultala", "Rupsa", "Terokhada", "Dighalia"],
    Jashore: ["Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Jashore Sadar", "Manirampur", "Sharsha"],
    Satkhira: ["Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Satkhira Sadar", "Shyamnagar", "Tala"],
    Bagerhat: ["Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola", "Bagerhat Sadar"],
    Kushtia: ["Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Kushtia Sadar", "Mirpur"],
    Magura: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
    Meherpur: ["Gangni", "Mujibnagar", "Meherpur Sadar"],
    Narail: ["Kalia", "Lohagara", "Narail Sadar"],
    Jhenaidah: ["Harinakundu", "Jhenaidah Sadar", "Kaliganj", "Kotchandpur", "Moheshpur", "Shailkupa"],
    Chuadanga: ["Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar"]
  },
  Barishal: {
    Barishal: ["Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gournadi", "Hizla", "Barishal Sadar", "Mehendiganj", "Muladi", "Uzirpur"],
    Barguna: ["Amtali", "Bamna", "Barguna Sadar", "Betagi", "Pathorghata", "Taltali"],
    Bhola: ["Bhola Sadar", "Borhanuddin", "Doulatkhan", "Lalmohan", "Monpura", "Tazumuddin", "Charfasson"],
    Jhalokathi: ["Jhalokathi Sadar", "Nalchity", "Kathalia", "Rajapur"],
    Patuakhali: ["Bauphal", "Dashmina", "Dumki", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali", "Galachipa"],
    Pirojpur: ["Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Pirojpur Sadar", "Nesarabad", "Zianagar"]
  },
  Sylhet: {
    Sylhet: ["Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Sylhet Sadar", "Zakiganj", "Osmani Nagar"],
    Moulvibazar: ["Barlekha", "Juri", "Kamalganj", "Kulaura", "Moulvibazar Sadar", "Rajnagar", "Sreemangal"],
    Habiganj: ["Ajmiriganj", "Bahubal", "Baniachong", "Chunarughat", "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj", "Shaistaganj"],
    Sunamganj: ["Bishwambarpur", "Chhatak", "Derai", "Dharmapasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Shalla", "Sunamganj Sadar", "Tahirpur", "Shantiganj", "Madhyanagar"]
  },
  Rangpur: {
    Rangpur: ["Badarganj", "Kaunia", "Rangpur Sadar", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj", "Gangachara"],
    Dinajpur: ["Birampur", "Birganj", "Birol", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharol", "Khansama", "Nawabganj", "Parbatipur", "Dinajpur Sadar"],
    Kurigram: ["Fulbari", "Bhurungamari", "Char Rajibpur", "Chilmari", "Kurigram Sadar", "Nageshwari", "Rajarhat", "Rowmari", "Ulipur"],
    Gaibandha: ["Fulchhari", "Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"],
    Nilphamari: ["Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar", "Saidpur", "Dimla"],
    Panchagarh: ["Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"],
    Thakurgaon: ["Pirganj", "Baliadangi", "Haripur", "Ranisankail", "Thakurgaon Sadar", "Bhulli", "Ruhia"],
    Lalmonirhat: ["Aditmari", "Hatibandha", "Kaliganj", "Lalmonirhat Sadar", "Patgram"]
  },
  Mymensingh: {
    Mymensingh: ["Bhaluka", "Dhobaura", "Fulbaria", "Gafargaon", "Gouripur", "Haluaghat", "Iswarganj", "Mymensingh Sadar", "Muktagachha", "Nandail", "Phulpur", "Tarakanda", "Trishal"],
    Netrokona: ["Atpara", "Barhatta", "Durgapur", "Khaliajuri", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Netrokona Sadar", "Purbadhala"],
    Sherpur: ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"],
    Jamalpur: ["Bakshiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandah", "Sarishabari"]
  }
};
const LS = window.localStorage, KEY = 'nf1';
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
const orgRef = () => doc(db, 'org', 'main');

let user = null, prof = null, isAdm = false, members = [], reg = null, mode = 'login';
let fv = { otype: 'Garments', mgmt: 'worker', otEdit: false, division: '', district: '', area: '' };
let unProf = null, unAdm = null, unMem = null, unOrg = null;
let deleting = false, authReady = false;
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
  if (/phone-login-off/.test(c)) return 'ফোন দিয়ে লগইন এখনো চালু হয়নি — ইমেইল দিয়ে লগইন করুন (অ্যাডমিন Firestore Rules পাবলিশ করলে চালু হবে)';
  if (/phone-not-found/.test(c)) return 'এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি';
  if (/network/.test(c)) return 'ইন্টারনেট সংযোগ নেই';
  if (/operation-not-allowed/.test(c)) return 'Firebase-এ Email/Password লগইন চালু নেই';
  if (/too-many/.test(c)) return 'অনেকবার চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন';
  if (/permission-denied/.test(c)) return 'অনুমতি নেই (Firestore Rules পাবলিশ হয়েছে কি?)';
  return 'সমস্যা: ' + (c || (e && e.message) || 'অজানা');
}

/* ---------- profile / approval ---------- */
const normPhone = v => { v = String(v || '').replace(/[^\d+]/g, ''); return v.startsWith('+880') ? v : v.startsWith('0') ? '+880' + v.slice(1) : '+880' + v.replace(/^\+/, ''); };
async function savePhone(u) {
  // ফোন → ইমেইল সূচি (ফোন দিয়ে লগইনের জন্য)। Rules পাবলিশ না থাকলে চুপচাপ বাদ যায়, সাইন-আপ আটকায় না
  try { if (reg && reg.phone) await setDoc(doc(db, 'phoneLogins', normPhone(reg.phone)), { uid: u.uid, email: u.email, at: Date.now() }); } catch (e) { /* ignore */ }
}
async function ensureProfile(u) {
  const mref = doc(db, 'members', u.uid);
  const snap = await getDoc(mref);
  if (snap.exists()) return;
  const r = reg || {};
  const name = r.name || (u.email || '').split('@')[0], title = r.title || '';
  const extra = r.phone ? { phone: r.phone } : {};
  let booted = true;
  try { booted = (await getDoc(doc(db, 'config', 'bootstrap'))).exists(); } catch (e) { booted = true; }
  if (!booted) {
    // very first account becomes the admin
    try {
      const b = writeBatch(db), at = Date.now();
      b.set(doc(db, 'config', 'bootstrap'), { uid: u.uid, email: u.email, at });
      b.set(doc(db, 'admins', u.uid), { email: u.email, at });
      b.set(mref, { email: u.email, name, title, ...extra, status: 'approved', role: 'admin', at });
      await b.commit();
      await savePhone(u);
      return;
    } catch (e) { /* someone else claimed it first: fall through */ }
  }
  await setDoc(mref, { email: u.email, name, title, ...extra, status: 'pending', role: 'staff', at: Date.now() });
  await savePhone(u);
}
async function resolveEmail(v) {
  if (v.includes('@')) return v;
  let s;
  try { s = await getDoc(doc(db, 'phoneLogins', normPhone(v))); }
  catch (e) { const x = new Error('phone login off'); x.code = /permission/.test((e && e.code) || '') ? 'phone-login-off' : (e && e.code); throw x; }
  if (!s.exists() || !s.data().email) { const x = new Error('not found'); x.code = 'phone-not-found'; throw x; }
  return s.data().email;
}
function subscribe(u) {
  unProf = onSnapshot(doc(db, 'members', u.uid), s => {
    prof = s.exists() ? s.data() : null;
    if (!s.exists() && !deleting) ensureProfile(u).catch(e => { msg = errText(e); render(); });
    onStateChange(); render();
  }, e => { msg = errText(e); render(); });
  unAdm = onSnapshot(doc(db, 'admins', u.uid), s => {
    isAdm = s.exists();
    if (isAdm && !unMem) {
      unMem = onSnapshot(collection(db, 'members'), q => {
        members = q.docs.map(d => ({ id: d.id, ...d.data() }));
        const n = members.filter(m => m.status === 'pending').length;
        if (n && !warned && !modal && typeof toast === 'function') { warned = true; toast(bn(n) + ' জন অনুমোদনের অপেক্ষায় — মেনু → প্রোফাইল'); }
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
const cssAx = `
.nfl .ax{--ap:#0f5132;--apd:#0a3a24;--ag:#c9a84c;--abd:#dfe3e1;--atx:#1b2a22;--amu:#6b7a72;--afb:#fff;--ain:#e7f2ec;text-align:left}
@media(prefers-color-scheme:dark){.nfl .ax{--ap:#2f7d5b;--apd:#1f5a40;--abd:#2f2f2f;--atx:#e6e6e6;--amu:#a2a2a2;--afb:#242424;--ain:#1f2a25}}
.nfl .cd.axc{max-width:380px;padding:26px 20px 22px;border-radius:22px;box-shadow:0 14px 40px rgba(15,81,50,.16)}
.ax .ax-av{width:92px;height:92px;border-radius:50%;background:var(--ain);border:1px solid var(--abd);margin:0 auto 14px;position:relative;overflow:hidden}
.ax .ax-av:before{content:"";position:absolute;top:19px;left:28px;width:36px;height:36px;border-radius:50%;background:#cbd5e1}
.ax .ax-av:after{content:"";position:absolute;bottom:-4px;left:14px;width:64px;height:36px;border-radius:30px 30px 0 0;background:#cbd5e1}
.ax .ax-t{margin:0 0 22px;text-align:center;font-size:19px;font-weight:600;color:var(--amu)}
.ax .ax-t.jn{color:var(--ap);font-size:23px;margin-bottom:20px}
.ax .ax-f{position:relative;margin:0 0 14px}
.ax .ax-l{display:block;font-size:12px;font-weight:700;color:var(--amu);margin:0 0 6px}
.nfl .cd .ax-i{display:block;width:100%;height:50px;box-sizing:border-box;margin:0;padding:0 16px;border:1px solid var(--abd);border-radius:14px;background:var(--afb);color:var(--atx);font:400 16px 'NF','Noto Sans Bengali',sans-serif;outline:0;transition:border-color .2s,box-shadow .2s}
.nfl .cd .ax-i::placeholder{color:#a8aba5;font-size:14px}
.nfl .cd .ax-i:focus{border-color:var(--ag);box-shadow:0 0 0 4px rgba(201,168,76,.18)}
.ax .ax-eye{position:absolute;right:6px;top:0;height:50px;width:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--amu);user-select:none;font-size:16px}
.ax .ax-pw .ax-i{padding-right:44px}
.nfl .cd .ax-reset{display:block;text-align:right;color:var(--ap);margin:-4px 0 4px;font-size:13px;font-weight:600;text-decoration:none;cursor:pointer}
.nfl .cd .ax-btn{display:block;width:100%;height:52px;margin:16px 0 0;border:0;border-radius:14px;color:#fff;background:linear-gradient(135deg,var(--apd),var(--ap) 50%,#1b7a56);box-shadow:0 8px 20px rgba(15,81,50,.28);font:700 15px 'NF','Noto Sans Bengali',sans-serif;letter-spacing:.4px;transition:transform .2s,box-shadow .2s}
.nfl .cd .ax-btn:active{transform:scale(.98)}
.nfl .cd .ax-btn[disabled]{opacity:.6}
.ax .ax-foot{text-align:center;color:var(--amu);margin-top:22px;font-size:14px}
.nfl .cd .ax-foot a,.nfl .cd .ax-foot a:visited{color:var(--ap);font-weight:700;text-decoration:none;font-size:14px;margin:0;cursor:pointer}
.ax .ax-dd{position:relative}.ax .ax-dd:has(.ax-menu.open){z-index:40}
.ax .ax-sel{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:50px;box-sizing:border-box;padding:0 16px;border:1px solid var(--abd);border-radius:14px;background:var(--afb);color:#a8aba5;font-size:14px;cursor:pointer;position:relative}
.ax .ax-sel.on{color:var(--atx);font-size:15px}
.ax .ax-sel>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ax .ax-sel:after{content:"▾";color:#8a948e;font-size:12px;margin-left:4px}
.ax .ax-sel.ot{padding-right:112px}.ax .ax-sel.ot:after{display:none}
.nfl .cd .ax-sel input{border:0;outline:0;background:transparent;color:var(--atx);font:400 15px 'NF','Noto Sans Bengali',sans-serif;width:100%;height:100%;padding:0;margin:0;box-sizing:border-box}
.ax .ax-mg{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:98px;height:34px;box-sizing:border-box;padding:2px 6px;font-size:10px;line-height:1.15;background:var(--ain);border:1px solid var(--ap);color:var(--ap);display:flex;align-items:center;justify-content:center;text-align:center;border-radius:10px;cursor:pointer;font-weight:700}
.ax .ax-menu{display:none;position:absolute;z-index:50;left:0;right:0;top:calc(100% + 4px);background:var(--afb);border-radius:14px;box-shadow:0 10px 30px rgba(15,81,50,.22);max-height:260px;overflow:auto;border:1px solid var(--abd)}
.ax .ax-menu.open{display:block}.ax .ax-menu.grid.open{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:6px}
.ax .ax-menu.mg{left:auto;width:170px}
.ax .ax-menu span{display:block;cursor:pointer;padding:11px 12px;font-size:13px;color:var(--atx);text-align:left}
.ax .ax-menu.grid span{text-align:center;border:1px solid var(--abd);border-radius:8px;padding:10px 4px;font-size:12px}
.ax .ax-menu span:active,.ax .ax-menu span.ck{background:var(--ain);color:var(--ap);font-weight:700}
.ax .ax-menu span.bk{grid-column:1/-1;background:var(--ain);color:var(--ap);font-weight:700;display:flex;justify-content:center}
.ax .ax-menu span.dn{grid-column:1/-1;display:flex;justify-content:flex-end;background:var(--ain);color:var(--ap);font-weight:700}
.nfl .cd .er{text-align:center}
`;
const cssPf = `
.pf{background:var(--c,#fff);color:var(--t,#111);border-radius:18px;padding:18px;box-shadow:var(--sh,0 2px 6px rgba(0,0,0,.08));max-width:460px;margin:0 auto 16px;font-family:'NF','Noto Sans Bengali',sans-serif}
.pf-h{margin:0 0 14px;padding-bottom:10px;border-bottom:2px solid var(--l,#e3e3e3);color:var(--pr,#111);font-size:19px}
.pf-r{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:0 0 10px;margin:0 0 12px;border-bottom:1px solid var(--l,#e3e3e3)}
.pf-r>div{min-width:0}
.pf-l{font-size:11.5px;font-weight:700;color:var(--m,#6b6b6b);margin-bottom:2px}
.pf-v{font-size:15px;font-weight:600;word-break:break-word}
.pf-e{flex:none;color:var(--pr,#0f5132);font-size:12px;font-weight:700;text-decoration:underline;cursor:pointer;padding:6px 4px}
.pf-s{margin:-2px 0 14px;padding:12px;border:1px solid var(--l,#e3e3e3);border-radius:14px;background:var(--bg,#f6f6f6)}
.pf-sl{font-size:12px;font-weight:700;color:var(--pr,#111);margin:0 0 4px}
.pf-i{display:block;width:100%;box-sizing:border-box;margin:0 0 8px;padding:12px 13px;border:1.5px solid var(--l,#ddd);border-radius:12px;background:var(--in,#fff);color:var(--t,#111);font:400 16px 'NF','Noto Sans Bengali',sans-serif}
.pf-b{display:block;width:100%;margin:8px 0 0;padding:11px;border:0;border-radius:12px;color:#fff;font:700 14px 'NF','Noto Sans Bengali',sans-serif}
.pf-up{background:var(--pr,#0f5132);color:var(--pt,#fff)}.pf-cn{background:var(--m,#6b6b6b)}.pf-dg{background:var(--no,#c8414f)}
.pf-er{min-height:16px;color:var(--no,#c8414f);font-size:12.5px;margin:0 0 4px}
.pf-w{color:var(--no,#c8414f);font-size:13px;font-weight:600;text-align:center;margin:0 0 8px}
.pf-ft{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:18px}
.pf-lk{color:var(--pr,#0f5132);font-size:13px;font-weight:700;cursor:pointer;padding:8px 2px}.pf-lk.dg{color:var(--no,#c8414f)}
.pf-ft .pf-b{width:auto;margin:0;padding:9px 18px;background:var(--no,#c8414f);color:#fff}
.pf-ap{margin-top:18px;padding-top:6px;border-top:2px solid var(--l,#e3e3e3)}`;
function ensureCss() {
  if (document.getElementById('nfcss')) return;
  const st = document.createElement('style'); st.id = 'nfcss'; st.textContent = css + cssAx + cssPf; document.head.appendChild(st);
}
function setLock(on) { document.documentElement.classList.toggle('nflock', on); }


/* ---------- Sign in / Sign up (Rah Care style) ---------- */
const OTYPES = ['Ruqyah & Hijama', 'Ruqyah', 'Hijama', 'Garments', 'School', 'Travel Agency'];
const MGMT = { patient: 'Patient Management', worker: 'Worker Management', student: 'Student Management', client: 'Client Management', staff: 'Staff Management' };
let axDoc = false;
function closeMenus(cd) { cd.querySelectorAll('.ax-menu.open').forEach(m => m.classList.remove('open')); }
function toggleMenu(cd, id) { const m = cd.querySelector('#' + id), was = m.classList.contains('open'); closeMenus(cd); if (!was) m.classList.add('open'); }
function addrLabel() { return [fv.division, fv.district, fv.area].filter(Boolean).join(', '); }
function wireAddress(cd) {
  const menu = cd.querySelector('#adMenu'), val = cd.querySelector('#adVal');
  if (!menu) return;
  const put = (d, t, a) => { fv.division = d || ''; fv.district = t || ''; fv.area = a || ''; val.value = addrLabel(); val.parentNode.classList.add('on'); };
  const item = (txt, fn, cls) => { const sp = document.createElement('span'); sp.textContent = txt; if (cls) sp.className = cls; sp.onclick = e => { e.stopPropagation(); fn(); }; menu.appendChild(sp); };
  const done = (d, t, a) => { put(d, t, a); menu.classList.remove('open'); divs(); };
  function divs() { menu.innerHTML = ''; Object.keys(ADDR).forEach(d => item(d, () => dists(d))); }
  function dists(d) {
    put(d); menu.innerHTML = ''; item('🔙 Back to Divisions', divs, 'bk');
    Object.keys(ADDR[d]).forEach(t => item(t, () => areas(d, t)));
    item('✓', () => done(d), 'dn');
  }
  function areas(d, t) {
    put(d, t); menu.innerHTML = ''; item('🔙 Back to Districts', () => dists(d), 'bk');
    (ADDR[d][t] || []).forEach(a => item(a, () => done(d, t, a)));
    item('✓', () => done(d, t), 'dn');
  }
  if (fv.division && !fv.district) dists(fv.division); else divs();
  val.onclick = () => toggleMenu(cd, 'adMenu');
}
function renderAuth(cd) {
  const reg_ = mode === 'register';
  const eye = (id, el) => { const i = cd.querySelector('#' + id); const on = i.type === 'password'; i.type = on ? 'text' : 'password'; el.textContent = on ? '🔒' : '👁'; };
  const er = `<div class="er" id="nfe">${esc(msg)}</div>`;
  const err = t => { const e = cd.querySelector('#nfe'); if (e) e.textContent = t; };
  cd.classList.add('axc');
  if (!reg_) {
    cd.innerHTML = `<div class="ax"><div class="ax-av"></div><h2 class="ax-t">Sign In</h2>
      <div class="ax-f"><input class="ax-i" id="lgu" placeholder="Phone / Email" autocomplete="username"></div>
      <div class="ax-f ax-pw"><input class="ax-i" id="lgp" type="password" placeholder="Password" autocomplete="current-password"><span class="ax-eye" id="eye1">👁</span></div>
      <a class="ax-reset" id="nff">Reset Password</a>${er}
      <button class="ax-btn" id="nfgo">Sign in</button>
      <div class="ax-foot">New here? <a id="nft2">Sign up</a></div></div>`;
    ['lgu', 'lgp'].forEach(k => { if (fv[k]) cd.querySelector('#' + k).value = fv[k]; });
    cd.querySelector('#eye1').onclick = e => eye('lgp', e.currentTarget);
    cd.querySelector('#nft2').onclick = () => { mode = 'register'; msg = ''; render(); };
    const go = cd.querySelector('#nfgo');
    const submit = async () => {
      const v = (fv.lgu || '').trim(), p = fv.lgp || '';
      if (!v || !p) { err('Phone / Email ও Password দিন'); return; }
      err('অপেক্ষা করুন…'); go.disabled = true;
      try { const m = await resolveEmail(v); await signInWithEmailAndPassword(auth, m, p); msg = ''; }
      catch (x) { go.disabled = false; err(errText(x)); }
    };
    go.onclick = submit;
    cd.querySelector('#lgp').onkeydown = e => { if (e.key === 'Enter') submit(); };
    cd.querySelector('#nff').onclick = async () => {
      const v = (fv.lgu || '').trim();
      if (!v) { err('আগে Phone / Email লিখুন'); return; }
      try { const m = await resolveEmail(v); await sendPasswordResetEmail(auth, m); err('পাসওয়ার্ড রিসেটের ইমেইল পাঠানো হয়েছে'); } catch (x) { err(errText(x)); }
    };
    return;
  }
  cd.innerHTML = `<div class="ax"><h2 class="ax-t jn">🌿 Join Now!</h2>
    <div class="ax-f"><label class="ax-l">Name</label><input class="ax-i" id="fname" placeholder="Enter your name" autocomplete="name"></div>
    <div class="ax-f"><label class="ax-l">Designation</label><input class="ax-i" id="desig" placeholder="Enter your designation" autocomplete="organization-title"></div>
    <div class="ax-f"><label class="ax-l">Phone</label><input class="ax-i" id="phone" type="tel" minlength="7" maxlength="15" placeholder="Enter your phone number" autocomplete="tel"></div>
    <div class="ax-f"><label class="ax-l">Email</label><input class="ax-i" id="email" type="email" placeholder="Email address" autocomplete="email"></div>
    <div class="ax-f"><label class="ax-l">Password</label><div class="ax-pw" style="position:relative"><input class="ax-i" id="spass" type="password" minlength="8" placeholder="Min 8 characters" autocomplete="new-password"><span class="ax-eye" id="eye2">👁</span></div></div>
    ${er}<button class="ax-btn" id="nfgo">Register</button>
    <div class="ax-foot">Already have an account? <a id="nft1">Sign in</a></div></div>`;
  ['fname', 'desig', 'phone', 'email', 'spass'].forEach(k => { if (fv[k]) cd.querySelector('#' + k).value = fv[k]; });
  cd.querySelector('#eye2').onclick = e => eye('spass', e.currentTarget);
  cd.querySelector('#nft1').onclick = () => { mode = 'login'; msg = ''; render(); };
  const go = cd.querySelector('#nfgo');
  go.onclick = async () => {
    const name = (fv.fname || '').trim(), title = (fv.desig || '').trim(), phone = (fv.phone || '').trim(), email = (fv.email || '').trim(), pass = fv.spass || '';
    if (!name) return err('Name লিখুন');
    if (!title) return err('Designation লিখুন');
    if (phone.replace(/\D/g, '').length < 7) return err('সঠিক Phone নম্বর দিন');
    if (!email) return err('Email দিন');
    if (pass.length < 8) return err('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে');
    err('অপেক্ষা করুন…'); go.disabled = true;
    reg = { name, title, phone };
    try { await createUserWithEmailAndPassword(auth, email, pass); msg = ''; }
    catch (x) { reg = null; go.disabled = false; err(errText(x)); }
  };
}

function lockRender() {
  if (!authReady) { setLock(!LS.getItem('nf_ok')); return; }
  const st = state();
  const optimistic = user && LS.getItem('nf_ok') === user.uid && st === 'loading';
  if (st === 'ok' || optimistic) {
    if (st === 'ok') LS.setItem('nf_ok', user.uid);
    if (lockEl) { lockEl.remove(); lockEl = null; lockKey = ''; }
    setLock(false); return;
  }
  if (!user || st === 'rejected') LS.removeItem('nf_ok');
  setLock(true);
  if (st === 'loading') { if (lockEl) { lockEl.remove(); lockEl = null; lockKey = ''; } return; }
  ensureCss();
  const key = st + '|' + mode + '|' + msg + '|' + (user ? user.uid : '');
  if (lockEl && key === lockKey) return;
  lockKey = key;
  if (!lockEl) { lockEl = document.createElement('div'); lockEl.className = 'nfl'; lockEl.innerHTML = '<div class="cd"></div>'; document.body.appendChild(lockEl);
    const c0 = lockEl.querySelector('.cd');
    c0.addEventListener('input', e => { if (e.target && e.target.id) fv[e.target.id] = e.target.value; });
    document.addEventListener('click', e => { if (lockEl && !e.target.closest('.ax-dd')) closeMenus(lockEl); });
  }
  lockEl.querySelector('.cd').classList.toggle('axc', st === 'out');
  const cd = lockEl.querySelector('.cd');
  const er = `<div class="er" id="nfe">${esc(msg)}</div>`;
  if (st === 'out') {
    renderAuth(cd);
  } else {
    const title = st === 'pending' ? '⏳ অনুমোদনের অপেক্ষায়' : st === 'rejected' ? '⛔ প্রবেশের অনুমতি নেই' : 'যাচাই হচ্ছে…';
    const body = st === 'pending' ? 'আপনার অ্যাকাউন্ট খোলা হয়েছে। অ্যাডমিন অনুমোদন দিলে অ্যাপ চালু হবে। অনুমোদনের পর এই পাতা নিজে থেকেই খুলে যাবে।'
      : st === 'rejected' ? 'অ্যাডমিন এই অ্যাকাউন্টে প্রবেশ বন্ধ রেখেছেন। প্রয়োজনে অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'একটু অপেক্ষা করুন…';
    cd.innerHTML = `<h3>${title}</h3><p>${esc(user.email)}<br>${body}</p>${er}<button id="nfo">লগআউট</button>`;
    cd.querySelector('#nfo').onclick = () => signOut(auth);
  }
}

/* ---------- Profile page (Rah Care style) ---------- */
const PF = [['name', 'Name'], ['title', 'Designation'], ['phone', 'Phone']];
let pf = { sec: '', field: '', err: '' };
const pfEl = () => document.getElementById('nfp');
const tst = t => { try { if (typeof toast === 'function') toast(t); } catch (e) { /* ignore */ } };
const pfErr = t => { pf.err = t; const e = document.getElementById('pfe'); if (e) e.textContent = t; };
const pfReset = () => { pf = { sec: '', field: '', err: '' }; profRender(true); };
const reauth = pw => reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pw));
async function movePhone(oldP, newP) {
  try {
    await setDoc(doc(db, 'phoneLogins', normPhone(newP)), { uid: user.uid, email: user.email, at: Date.now() });
    if (oldP && normPhone(oldP) !== normPhone(newP)) await deleteDoc(doc(db, 'phoneLogins', normPhone(oldP)));
  } catch (e) { /* rules may not be published yet: ignore */ }
}
function editBox(f, l, raw) {
  const inp = `<input class="pf-i" id="pfin" type="${f === 'phone' ? 'tel' : 'text'}" value="${esc(raw)}">`;
  return `<div class="pf-s"><div class="pf-sl">${l}</div>${inp}<div class="pf-er" id="pfe">${esc(pf.err)}</div><button class="pf-b pf-up" data-act="save">Save</button><button class="pf-b pf-cn" data-act="cancel">Cancel</button></div>`;
}
function emailBox() {
  return `<div class="pf-s"><div class="pf-sl">New Email</div><input class="pf-i" id="pfem" type="email" autocomplete="email"><div class="pf-sl">Current Password</div><input class="pf-i" id="pfpw" type="password" autocomplete="current-password"><div class="pf-er" id="pfe">${esc(pf.err)}</div><button class="pf-b pf-up" data-act="saveemail">Save</button><button class="pf-b pf-cn" data-act="cancel">Cancel</button></div>`;
}
function passBox() {
  return `<div class="pf-s"><div class="pf-sl">Current Password</div><input class="pf-i" id="pfcp" type="password" autocomplete="current-password"><div class="pf-sl">New Password</div><input class="pf-i" id="pfnp" type="password" placeholder="Min 8 characters" autocomplete="new-password"><div class="pf-er" id="pfe">${esc(pf.err)}</div><button class="pf-b pf-up" data-act="savepass">Confirm Change</button><button class="pf-b pf-cn" data-act="cancel">Cancel</button></div>`;
}
function delBox() {
  if (isAdm) return `<div class="pf-s"><div class="pf-w">অ্যাডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না — এতে প্রতিষ্ঠানের ডেটা অ্যাডমিনহীন হয়ে যাবে।</div><button class="pf-b pf-cn" data-act="cancel">Cancel</button></div>`;
  return `<div class="pf-s"><div class="pf-w">Warning: Your account will be deleted permanently. Shared organisation data stays with the organisation.</div><input class="pf-i" id="pfdp" type="password" placeholder="Password" autocomplete="current-password"><div class="pf-er" id="pfe">${esc(pf.err)}</div><button class="pf-b pf-dg" data-act="delete">Yes, Delete</button><button class="pf-b pf-cn" data-act="cancel">Cancel</button></div>`;
}
function approvalHTML() {
  if (!isAdm) return '';
  const pend = members.filter(m => m.status === 'pending'), rest = members.filter(m => m.status !== 'pending').sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const row = m => `<div class="mr"><div><b>${esc(m.name || m.email)}${m.title ? ' — ' + esc(m.title) : ''}</b>${esc(m.email)}${m.phone ? ' · ' + esc(m.phone) : ''}${m.district ? ' · ' + esc(m.district) : ''} <span class="bd">${m.status === 'approved' ? 'চালু' : m.status === 'pending' ? 'অপেক্ষায়' : 'বন্ধ'}</span></div>
    ${m.id === user.uid ? '' : (m.status !== 'approved' ? `<button class="pr" data-ap="${m.id}">অনুমোদন</button>` : '') + (m.status !== 'rejected' ? `<button data-rj="${m.id}">${m.status === 'pending' ? 'বাতিল' : 'বন্ধ করুন'}</button>` : '')}</div>`;
  return `<div class="cd pf-ap"><h4>অ্যাকাউন্ট অনুমোদন${pend.length ? ' (' + bn(pend.length) + ' জন অপেক্ষায়)' : ''}</h4>${pend.map(row).join('')}${rest.map(row).join('')}</div>`;
}
function profRender(force) {
  const el = pfEl(); if (!el || !user) return;
  ensureCss();
  if (!prof) { el.innerHTML = '<div class="pf"><h3 class="pf-h">Profile</h3><div class="pf-v">লোড হচ্ছে…</div></div>'; return; }
  if (!force && pf.sec && el.firstChild && el.querySelector('.pf-s')) return;
  const rowOf = (f, l, val, key) => `<div class="pf-r"><div><div class="pf-l">${l}</div><div class="pf-v">${esc(val) || 'N/A'}</div></div><span class="pf-e" data-ed="${key}">Edit</span></div>`;
  const rows = PF.map(([f, l]) => rowOf(f, l, prof[f], f) + (pf.sec === 'f' && pf.field === f ? editBox(f, l, prof[f] || '') : '')).join('')
    + rowOf('email', 'Email', prof.email || user.email, '__email') + (pf.sec === 'e' ? emailBox() : '');
  el.innerHTML = `<div class="pf"><h3 class="pf-h">Profile${isAdm ? ' · Admin' : ''}</h3>${rows}
    <div class="pf-ft"><span class="pf-lk" data-act="openpass">Change Password</span><button class="pf-b" data-act="logout">Logout</button><span class="pf-lk dg" data-act="opendel">Delete Account</span></div>
    ${pf.sec === 'p' ? passBox() : ''}${pf.sec === 'd' ? delBox() : ''}</div>${approvalHTML()}`;
  const sec = el.querySelector('.pf-s'); if (sec) { try { sec.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* ignore */ } const i = sec.querySelector('input,select'); if (i) i.focus(); }
  el.onclick = onProfClick;
}
async function onProfClick(e) {
  const t = e.target.closest('[data-ed],[data-act],[data-ap],[data-rj]'); if (!t) return;
  const el = pfEl(), g = id => el.querySelector('#' + id);
  const d = t.dataset;
  if (d.ap) return decide(d.ap, 'approved');
  if (d.rj) return decide(d.rj, 'rejected');
  if (d.ed) { pf = { sec: d.ed === '__email' ? 'e' : 'f', field: d.ed, err: '' }; return profRender(true); }
  const a = d.act;
  if (a === 'cancel') return pfReset();
  if (a === 'openpass') { pf = { sec: 'p', field: '', err: '' }; return profRender(true); }
  if (a === 'opendel') { pf = { sec: 'd', field: '', err: '' }; return profRender(true); }
  if (a === 'logout') return signOut(auth);
  if (a === 'save') {
    const f = pf.field, v = (g('pfin').value || '').trim();
    if (!v) return pfErr('This field cannot be empty!');
    if (f === 'phone' && v.replace(/\D/g, '').length < 7) return pfErr('সঠিক Phone নম্বর দিন');
    const upd = { [f]: v };
    pfErr('অপেক্ষা করুন…');
    try {
      await updateDoc(doc(db, 'members', user.uid), upd);
      if (f === 'phone') await movePhone(prof.phone, v);
      pfReset(); tst('Updated successfully!');
    } catch (x) { pfErr(errText(x)); }
    return;
  }
  if (a === 'saveemail') {
    const em = (g('pfem').value || '').trim(), pw = g('pfpw').value;
    if (!em || !pw) return pfErr('Please enter both new email and current password.');
    pfErr('অপেক্ষা করুন…');
    try {
      await reauth(pw);
      try { await updateEmail(user, em); }
      catch (x) {
        if (/operation-not-allowed/.test((x && x.code) || '')) { await verifyBeforeUpdateEmail(user, em); pfReset(); tst('নতুন ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে — লিংকে চাপ দিলে ইমেইল বদলাবে'); return; }
        throw x;
      }
      await user.getIdToken(true);
      await updateDoc(doc(db, 'members', user.uid), { email: em });
      if (prof && prof.phone) await movePhone(prof.phone, prof.phone);
      pfReset(); tst('Email changed successfully!');
    } catch (x) { pfErr(/requires-recent-login/.test((x && x.code) || '') ? 'নিরাপত্তার জন্য আবার লগইন করে চেষ্টা করুন' : errText(x)); }
    return;
  }
  if (a === 'savepass') {
    const cp = g('pfcp').value, np = g('pfnp').value;
    if (!cp || !np) return pfErr('Please enter both passwords');
    if (np.length < 8) return pfErr('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে');
    pfErr('অপেক্ষা করুন…');
    try { await reauth(cp); await updatePassword(user, np); pfReset(); tst('Password changed successfully!'); }
    catch (x) { pfErr(errText(x)); }
    return;
  }
  if (a === 'delete') {
    if (isAdm) return;
    const pw = g('pfdp').value;
    if (!pw) return pfErr('Please enter password!');
    pfErr('অপেক্ষা করুন…');
    try {
      await reauth(pw);
      deleting = true;
      const ph = prof && prof.phone;
      if (ph) { try { await deleteDoc(doc(db, 'phoneLogins', normPhone(ph))); } catch (x) { /* ignore */ } }
      await deleteDoc(doc(db, 'members', user.uid));
      await deleteUser(user);
      LS.removeItem('nf_ok'); deleting = false;
    } catch (x) { deleting = false; pfErr(errText(x)); }
  }
}
async function decide(id, status) {
  try { await updateDoc(doc(db, 'members', id), { status, decidedAt: Date.now(), decidedBy: user.email }); }
  catch (e) { syncMsg = errText(e); render(); }
}
function render() { lockRender(); profRender(false); }

onAuthStateChanged(auth, u => {
  authReady = true;
  unsubscribeAll(); user = u; msg = ''; syncMsg = '';
  if (u) subscribe(u);
  render();
});
window.addEventListener('online', () => { if (state() === 'ok' && LS.getItem('nf_dirty') === '1') schedule(); });
window.NFC = { prof() { pf = { sec: '', field: '', err: '' }; profRender(true); }, dirty() { LS.setItem('nf_dirty', '1'); if (state() === 'ok') schedule(); } };
render();
