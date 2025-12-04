const axios = require('axios');

const API_URL = 'http://localhost:5000';

// --- Fertility Prediction Function ---
const predictFertility = async () => {
    console.log("Fetching form data for Fertility Prediction...");

    // Dynamically collect form values
    const form = document.getElementById('fertility-form');
    const formData = new FormData(form);

    const fertilityData = {};
    const fields = ['N', 'P', 'K', 'pH', 'EC', 'OC', 'S', 'Zn', 'Fe', 'Cu', 'Mn', 'B'];

    fields.forEach(field => {
        fertilityData[field] = parseFloat(formData.get(field));
    });

    try {
        const response = await axios.post(`${API_URL}/api/crops/fertility`, fertilityData);
        
        console.log("--- Fertility Prediction Result ---");
        console.log("Data Sent:", fertilityData);
        console.log("Response:", response.data);
        console.log("---------------------------------");

        return response.data;
    } catch (error) {
        console.error("Error connecting to the fertility endpoint:", error.message);
        if (error.response) {
            console.error("Server responded with:", error.response.data);
        }
    }
};

// --- Irrigation Prediction Function ---
const predictIrrigation = async () => {
    console.log("Fetching form data for Irrigation Prediction...");

    const form = document.getElementById('moisture-form');
    const formData = new FormData(form);

    const moistureData = {};
    ['moisture0', 'moisture1', 'moisture2', 'moisture3', 'moisture4'].forEach(field => {
        moistureData[field] = parseFloat(formData.get(field));
    });

    try {
        const response = await axios.post(`${API_URL}/api/crops/moisture`, moistureData);
        
        console.log("--- Irrigation Prediction Result ---");
        console.log("Data Sent:", moistureData);
        console.log("Response:", response.data);
        console.log("----------------------------------");

        return response.data;
    } catch (error) {
        console.error("Error connecting to the irrigation endpoint:", error.message);
        if (error.response) {
            console.error("Server responded with:", error.response.data);
        }
    }
};
