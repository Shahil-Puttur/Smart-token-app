document.addEventListener('DOMContentLoaded', () => {
    const registrationSection = document.getElementById('registration-section');
    const tokenSection = document.getElementById('token-section');
    const patientForm = document.getElementById('patient-form');

    const yourTokenEl = document.getElementById('your-token');
    const currentTokenEl = document.getElementById('current-token');

    const countersRef = database.ref('counters');
    const tokensRef = database.ref('tokens');

    // Helper function to play audio after user interaction
    const playAudio = (src) => {
        const audio = new Audio(src);
        audio.play().catch(error => console.error("Audio playback failed:", error));
    };

    // --- Main Logic ---

    // 1. Listen for changes to the current token being served
    countersRef.child('currentToken').on('value', (snapshot) => {
        const currentToken = snapshot.val() || '–';
        currentTokenEl.textContent = currentToken;
    });

    // 2. Handle form submission
    patientForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;

        // Use a transaction to get a new, unique token number
        countersRef.child('tokenNumber').transaction((currentValue) => {
            return (currentValue || 0) + 1;
        }, (error, committed, snapshot) => {
            if (error) {
                console.error('Transaction failed abnormally!', error);
                alert('Could not get a token. Please try again.');
            } else if (!committed) {
                console.log('Transaction not committed.');
                alert('Could not get a token due to high traffic. Please try again.');
            } else {
                const newTokenNumber = snapshot.val();
                
                // Create the new patient object
                const newPatient = {
                    name: name,
                    phone: phone,
                    tokenNumber: newTokenNumber,
                    status: 'waiting', // waiting, called, skipped
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };

                // Save the new patient data using the token number as the key
                tokensRef.child(newTokenNumber).set(newPatient)
                    .then(() => {
                        // Success! Update UI
                        yourTokenEl.textContent = newTokenNumber;
                        registrationSection.classList.add('hidden');
                        tokenSection.classList.remove('hidden');

                        // Store token in local storage in case of page refresh
                        localStorage.setItem('myTokenNumber', newTokenNumber);

                        // Play welcome sound
                        playAudio('sounds/welcome.mp3');
                    })
                    .catch(err => {
                        console.error("Failed to save patient data:", err);
                        alert("An error occurred. Please try again.");
                    });
            }
        });
    });

    // 3. Check if user already has a token on page load
    const savedToken = localStorage.getItem('myTokenNumber');
    if (savedToken) {
        yourTokenEl.textContent = savedToken;
        registrationSection.classList.add('hidden');
        tokenSection.classList.remove('hidden');
    }
});
