// js/staff.js

document.addEventListener('DOMContentLoaded', () => {
  const currentTokenDisplay = document.getElementById('current-token-display');
  const waitingListEl = document.getElementById('waiting-list');
  const nextBtn = document.getElementById('next-btn');
  const noPatientsMessage = document.getElementById('no-patients-message');

  const countersRef = database.ref('counters');
  const tokensRef = database.ref('tokens');

  // Prepare audios once on load
  const alarmAudio = new Audio('sounds/alarm.mp3');
  alarmAudio.preload = 'auto';

  const skippedAudio = new Audio('sounds/skipped.mp3');
  skippedAudio.preload = 'auto';

  // Update current token display in real-time
  countersRef.child('currentToken').on('value', snapshot => {
    const current = snapshot.val() || '–';
    currentTokenDisplay.textContent = current;
  });

  // Listen for all waiting patients
  tokensRef.orderByChild('status').equalTo('waiting').on('value', snapshot => {
    waitingListEl.innerHTML = '';
    if (!snapshot.exists()) {
      noPatientsMessage.classList.remove('hidden');
      noPatientsMessage.textContent = "No patients waiting.";
      return;
    }
    noPatientsMessage.classList.add('hidden');

    // Sort patients by tokenNumber ascending
    const waitingPatients = [];
    snapshot.forEach(child => {
      waitingPatients.push({ key: child.key, ...child.val() });
    });
    waitingPatients.sort((a, b) => a.tokenNumber - b.tokenNumber);

    waitingPatients.forEach(patient => {
      const li = document.createElement('li');
      li.classList.add('token-item');
      li.dataset.key = patient.key;

      li.innerHTML = `
        <div class="token-item-info">
          <span class="token-item-number">${patient.tokenNumber}</span>
          <div class="token-item-details">
            <strong>${patient.name}</strong><br>
            <span>Phone: ${patient.phone}</span>
          </div>
        </div>
        <div class="token-item-actions">
          <button class="btn btn-skip" data-token-number="${patient.tokenNumber}">Skip</button>
        </div>`;

      waitingListEl.appendChild(li);
    });

    // Attach Skip button event listener
    document.querySelectorAll('.btn-skip').forEach(button => {
      button.onclick = handleSkip;
    });
  });

  // "Next" button click handler
  nextBtn.addEventListener('click', () => {
    // Get the first waiting patient (lowest token number)
    tokensRef.orderByChild('status').equalTo('waiting').limitToFirst(1).once('value').then(snapshot => {
      if (!snapshot.exists()) {
        alert('No patients are waiting!');
        return;
      }

      let nextPatientKey = null;
      let nextTokenNumber = null;
      snapshot.forEach(child => {
        nextPatientKey = child.key;
        nextTokenNumber = child.val().tokenNumber;
      });

      if (!nextPatientKey) {
        alert('No patients are waiting!');
        return;
      }

      // Update the token status to "called"
      const updates = {};
      updates[`tokens/${nextPatientKey}/status`] = 'called';
      updates[`counters/currentToken`] = nextTokenNumber;

      database.ref().update(updates).then(() => {
        alarmAudio.play().catch(err => console.warn('Alarm audio playback failed:', err));
      }).catch(err => {
        alert('Failed to update token status.');
        console.error('Update error:', err);
      });
    });
  });

  // Skip button handler
  function handleSkip(e) {
    const tokenNum = e.target.getAttribute('data-token-number');
    if (!tokenNum) return;

    // Find patient key by token number
    tokensRef.orderByChild('tokenNumber').equalTo(+tokenNum).once('value').then(snapshot => {
      snapshot.forEach(child => {
        const key = child.key;
        tokensRef.child(key).update({ status: 'skipped' })
          .then(() => {
            skippedAudio.play().catch(err => console.warn('Skipped audio playback failed:', err));
          })
          .catch(err => {
            alert('Failed to skip patient.');
            console.error('Skip error:', err);
          });
      });
    });
  }
});
