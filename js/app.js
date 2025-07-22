// js/app.js

document.addEventListener('DOMContentLoaded', () => {
  const patientForm = document.getElementById('patient-form');
  const registrationSection = document.getElementById('registration-section');
  const tokenSection = document.getElementById('token-section');
  const yourTokenEl = document.getElementById('your-token');
  const currentTokenEl = document.getElementById('current-token');

  const countersRef = database.ref('counters');
  const tokensRef = database.ref('tokens');

  // Prepare welcome audio once here (preload)
  const welcomeAudio = new Audio('sounds/welcome.mp3');
  welcomeAudio.preload = 'auto';

  // Listen for current token changes and update UI live
  countersRef.child('currentToken').on('value', snapshot => {
    const currentToken = snapshot.val() || '–';
    currentTokenEl.textContent = currentToken;
  });

  // Load token from localStorage if already exists, so patient does not lose their token on refresh
  function loadSavedToken() {
    const savedToken = localStorage.getItem('myTokenNumber');
    if (savedToken) {
      yourTokenEl.textContent = savedToken;
      registrationSection.classList.add('hidden');
      tokenSection.classList.remove('hidden');
    }
  }
  loadSavedToken();

  // Validate form inputs with simple checks and alerts
  function validateInputs(name, phone) {
    if (!name || name.trim().length < 2) {
      alert('Please enter a valid name.');
      return false;
    }
    if (!phone || !/^\d{10}$/.test(phone.trim())) {
      alert('Please enter a valid 10-digit phone number.');
      return false;
    }
    return true;
  }

  patientForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = patientForm.name.value.trim();
    const phone = patientForm.phone.value.trim();

    if (!validateInputs(name, phone)) {
      return;
    }

    // Disable button to avoid double submits
    patientForm.querySelector('button[type="submit"]').disabled = true;

    // Atomically increment tokenNumber using transaction
    countersRef.child('tokenNumber').transaction(current => (current || 0) + 1,
      (error, committed, snapshot) => {
        if (error) {
          alert('Error getting token number, please try again.');
          console.error('Transaction error:', error);
          patientForm.querySelector('button[type="submit"]').disabled = false;
        } else if (!committed) {
          alert('Please try again to get your token.');
          patientForm.querySelector('button[type="submit"]').disabled = false;
        } else {
          const newTokenNumber = snapshot.val();

          // Save patient data with token number as key
          const patientData = {
            name,
            phone,
            status: 'waiting',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            tokenNumber: newTokenNumber
          };

          tokensRef.child(newTokenNumber).set(patientData)
            .then(() => {
              // Update UI to show token assigned
              yourTokenEl.textContent = newTokenNumber;
              registrationSection.classList.add('hidden');
              tokenSection.classList.remove('hidden');

              // Store patient token locally for refresh
              localStorage.setItem('myTokenNumber', newTokenNumber);

              // Play welcome audio with proper async handling
              welcomeAudio.play().catch(err => {
                console.warn('Audio playback failed:', err);
              });
            })
            .catch(err => {
              alert('Failed to save data, please try again.');
              console.error('Error saving patient data:', err);
              patientForm.querySelector('button[type="submit"]').disabled = false;
            });
        }
      });
  });
});
