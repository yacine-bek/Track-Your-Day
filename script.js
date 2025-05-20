// Load Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";

// CONFIG – Don't hardcode in production
import { firebaseConfig } from './firebase-config.js'; // 🔐 External secure file

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Track current user UID after sign-in
let currentUID = null;

// Sign in anonymously
signInAnonymously(auth)
    .then(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUID = user.uid;
                console.log("Signed in. UID:", currentUID);
            } else {
                console.error("User not authenticated.");
            }
        });
    })
    .catch((error) => {
        alert("Auth failed: " + error.message);
    });

// Submit ranges
window.submitRanges = function () {
    if (!currentUID) return alert("Not authenticated.");

    const data = {
        god: Number(document.getElementById("god").value),
        nas: Number(document.getElementById("nas").value),
        future: Number(document.getElementById("future").value),
        self: Number(document.getElementById("self").value),
        happy: Number(document.getElementById("happy").value),
    };

    const today = new Date().toISOString().split("T")[0];
    const dailyRef = ref(db, "daily/" + currentUID + "/" + today);

    set(dailyRef, data)
        .then(() => alert("Your data was saved successfully!"))
        .catch((error) => alert("Error saving data: " + error.message));
};

// Load the last 7 days
window.loadWeekData = async function () {
    if (!currentUID) return alert("Not authenticated.");
    const today = new Date();
    const results = [];
    const dbRef = ref(db);

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formatted = date.toISOString().split("T")[0];
        try {
            const snapshot = await get(child(dbRef, "daily/" + currentUID + "/" + formatted));
            results.push({ date: formatted, data: snapshot.exists() ? snapshot.val() : null });
        } catch (error) {
            console.error("Error reading data:", error);
        }
    }

    console.log(results);
    alert(JSON.stringify(results, null, 2));
};
