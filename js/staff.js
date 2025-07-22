document.addEventListener('DOMContentLoaded', () => {
    const currentTokenDisplay = document.getElementById('current-token-display');
    const waitingListEl = document.getElementById('waiting-list');
    const nextBtn = document.getElementById('next-btn');
    const noPatientsMessage = document.getElementById('no-patients-message');

    const countersRef = database.ref('counters');
    const tokensRef = database.ref('tokens');
    let waitingPatients = []; // Local cache of waiting patients

    // Helper function to play audio
    const playAudio = (src) => {
        const audio = new Audio(src);
        audio.play().catch(error => console.error("Audio playback failed:", error));
    };

    // --- Real-time Listeners ---

    // 1. Listen for changes to the current token
    countersRef.child('currentToken').on('value', (snapshot) => {
        currentTokenDisplay.textContent = snapshot.val() || '–';
    });

    // 2. Listen for waiting patients (ordered by token number)
    tokensRef.orderByChild('status').equalTo('waiting').on('value', (snapshot) => {
        waitingListEl.innerHTML = ''; // Clear the list first
        waitingPatients = [];
        
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                // Firebase returns in order, so push to array
                waitingPatients.push({ key: childSnapshot.key, ...childSnapshot.val() });
            });
            noPatientsMessage.classList.add('hidden');
            renderWaitingList();
        } else {
            waitingListEl.appendChild(noPatientsMessage);
            noPatientsMessage.classList.remove('hidden');
        }

        // Enable/disable button based on queue
        nextBtn.disabled = waitingPatients.length === 0;
    });

    // --- UI Rendering ---

    const renderWaitingList = () => {
        waitingPatients.forEach(patient => {
            const li = document.createElement('li');
            li.className = 'token-item';
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
                    <button class="btn-skip" data-token-number="${patient.tokenNumber}">Skip</button>
                </div>
            `;
            waitingListEl.appendChild(li);
        });

        // Add event listener for the new "Skip" buttons
        document.querySelectorAll('.btn-skip').forEach(button => {
            button.addEventListener('click', handleSkip);
        });
    };

    // --- Event Handlers ---

    // "Call Next" button click
    nextBtn.addEventListener('click', () => {
        if (waitingPatients.length === 0) {
            alert('No patients are waiting.');
            return;
        }

        const nextPatient = waitingPatients[0]; // The first patient in the sorted list
        const updates = {};
        updates[`/tokens/${nextPatient.key}/status`] = 'called';
        updates[`/counters/currentToken`] = nextPatient.tokenNumber;

        database.ref().update(updates)
            .then(() => {
                playAudio('sounds/alarm.mp3');
            })
            .catch(err => console.error("Failed to call next patient:", err));
    });

    // "Skip" button click (uses event delegation concept)
    const handleSkip = (e) => {
        const tokenNumberToSkip = e.target.dataset.tokenNumber;
        const updates = {};
        updates[`/tokens/${tokenNumberToSkip}/status`] = 'skipped';
        
        database.ref().update(updates)
             .then(() => {
                playAudio('sounds/skipped.mp3');
             })
             .catch(err => console.error("Failed to skip patient:", err));
    };
});
