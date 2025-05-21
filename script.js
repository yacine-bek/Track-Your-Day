// Load Firebase SDKs 
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";

// CONFIG – Don't hardcode in production 
import { firebaseConfig as rawConfig } from './firebase-config.js';

const firebaseConfig = {
  ...rawConfig,
  apiKey: atob(rawConfig.apiKey),
};

// Initialize Firebase 
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);


let cachedWeekData = [];


let currentUID = null;


function get_username() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get("username");
    return username;
}

// Sign in anonymously 
signInAnonymously(auth)
    .then(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUID = get_username();
                window.loadWeekData();
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
    .then(() => {
        alert("Your data was saved successfully!");
        window.loadWeekData();
    })
    .catch((error) => alert("Error saving data: " + error.message));

};



// Load the last 7 days 
window.loadWeekData = async function () {
    if (!currentUID) return alert("Not authenticated.");
    const today = new Date();
    const results = [];
    const dbRef = ref(db);
    const type = document.getElementById("typeSelector").value

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
    cachedWeekData = results; // Save data for later redraws
    drawGraph(cachedWeekData, type);

};

window.onTypeChange = function (newType) {
    if (!cachedWeekData.length) return;
    drawGraph(cachedWeekData, newType);
};




function drawGraph(dataArray, type) {
    const filtered = dataArray
        .filter(entry => entry.data !== null) // skip missing days
        .sort((a, b) => a.date.localeCompare(b.date));

    const labels = filtered.map(entry => entry.date);
    const values = filtered.map(entry => entry.data[type]);

    const ctx = document.getElementById('myChart').getContext('2d');

    const chartData = {
        labels: labels,
        datasets: [{
            label: `${type} percentage`,
            data: values,
            fill: false,
            borderColor: 'blue',
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7
        }]
    };

    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        callback: value => value + '%'
                    },
                    title: {
                        display: true,
                        text: 'Percentage'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    };

    if (window.myChart instanceof Chart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, config);
}


