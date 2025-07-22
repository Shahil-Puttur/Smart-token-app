// patient.js
import { db }    from './firebase-config.js';
import { ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const tokenRef = ref(db, 'token');
const formDiv  = document.getElementById('form');
const userDiv  = document.getElementById('user-token');
const nameEl   = document.getElementById('name');
const phoneEl  = document.getElementById('phone');
const submitBtn= document.getElementById('submitBtn');
const myTokenD = document.getElementById('myTokenDisplay');
const curTokD  = document.getElementById('currentTokenDisplay');
const welcomeA = document.getElementById('welcomeAudio');
const alarmA   = document.getElementById('alarmAudio');
const skippedA = document.getElementById('skippedAudio');

let myKey = null;

// Submit patient info
submitBtn.onclick = () => {
  const name  = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  if (!name || !phone) return alert('Fill both fields!');

  push(tokenRef, { name, phone, status: 'waiting' })
    .then(() => {
      welcomeA.play();
      formDiv.style.display = 'none';
      userDiv.style.display = 'block';
      pollTokens();
    });
};

// Poll Firebase for updates
function pollTokens(){
  onValue(tokenRef, snapshot => {
    const data = snapshot.val() || {};
    const list = Object.entries(data).map(([key,val])=>({ key,...val }));
    // find my token record
    const me = list.find(p => p.phone === phoneEl.value.trim());
    myKey = me ? me.key : null;
    // compute current = first called
    const called = list.find(p => p.status === 'called');
    curTokD.innerText = `Current Token: ${called ? called.name : '-'}`;
    myTokenD.innerText  = `Your Token: ${me ? me.name : '-'}`;

    // if I'm called now
    if (me && called && me.key === called.key) {
      alarmA.play();
    }
    // if I'm skipped
    if (me && me.status === 'skipped') {
      skippedA.play();
      myTokenD.innerText = 'Your token was skipped.';
    }
  });
  }
