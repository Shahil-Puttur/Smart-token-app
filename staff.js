// staff.js
import { db }    from './firebase-config.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const tokenRef    = ref(db, 'token');
const nextBtn     = document.getElementById('nextBtn');
const skipBtn     = document.getElementById('skipBtn');
const currentEl   = document.getElementById('currentPatient');
const alarmA      = document.getElementById('alarmAudio');
const skippedA    = document.getElementById('skippedAudio');

let tokens = [];

// Listen for changes
onValue(tokenRef, snapshot => {
  tokens = [];
  snapshot.forEach(child => {
    tokens.push({ key: child.key, ...child.val() });
  });
  const called = tokens.find(t => t.status === 'called');
  currentEl.innerText = `Current: ${called ? called.name : '-'}`;
});

// Next patient
nextBtn.onclick = () => {
  const waiting = tokens.find(t => t.status === 'waiting');
  if (!waiting) return alert('No waiting patient');
  // mark existing 'called' as done
  const updates = {};
  tokens.filter(t=>t.status==='called')
        .forEach(t=> updates[`${t.key}/status`] = 'done');
  updates[`${waiting.key}/status`] = 'called';
  update(tokenRef, updates);
  alarmA.play();
};

// Skip patient
skipBtn.onclick = () => {
  const waiting = tokens.find(t => t.status === 'waiting');
  if (!waiting) return alert('No waiting to skip');
  update(tokenRef, { [`${waiting.key}/status`]: 'skipped' });
  skippedA.play();
};
