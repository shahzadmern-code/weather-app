
const API_KEY = "b850bf84a85a0883e0770ce8632eda28";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationSelect = document.getElementById("location-select");
const message = document.getElementById("message");
console.log("Message element:", message);
const weatherCard = document.getElementById("weather-card");

const cityName = document.getElementById("city-name");
const dateElement = document.getElementById("date");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");

let matchingLocations = [];

// Search for cities in India.
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        message.textContent = "Please enter a city name.";
        return;
    }

    if (
        !API_KEY ||
        API_KEY.trim() === "" ||
        API_KEY === "YOUR_NEW_API_KEY_HERE"
    ) {
        message.textContent = "Please add your API key in script.js.";
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";
    message.textContent = "Finding matching cities...";
    weatherCard.hidden = true;
    locationSelect.hidden = true;
    locationSelect.replaceChildren();
    matchingLocations = [];

    try {
        const geoUrl = new URL(
            "https://api.openweathermap.org/geo/1.0/direct"
        );

        geoUrl.search = new URLSearchParams({
            q: `${city},IN`,
            limit: 10,
            appid: API_KEY
        });

        const response = await fetch(geoUrl);
        const results = await response.json();

        if (!response.ok) {
            throw new Error(
                results.message || "Unable to search for cities."
            );
        }

        // Keep Indian results and remove duplicate coordinates.
        const seen = new Set();

        matchingLocations = results.filter((place) => {
            if (place.country !== "IN") return false;

            const key =
                `${place.lat.toFixed(3)},${place.lon.toFixed(3)}`;

            if (seen.has(key)) return false;

            seen.add(key);
            return true;
        });

        if (matchingLocations.length === 0) {
            throw new Error(
                "No matching Indian cities found. Try another spelling."
            );
        }

        // Build dropdown options safely.
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose the correct city...";
        locationSelect.appendChild(placeholder);

        matchingLocations.forEach((place, index) => {
            const option = document.createElement("option");
            option.value = String(index);

            const state = place.state
                ? `, ${place.state}`
                : "";

            option.textContent =
                `${place.name}${state}, India`;

            locationSelect.appendChild(option);
        });

        locationSelect.hidden = false;
        message.textContent =
            "Select the correct city and state from the list.";

    } catch (error) {
        message.textContent =
            error.message || "Something went wrong.";
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
});

// Fetch weather only after the user chooses a location.
locationSelect.addEventListener("change", async () => {
    if (locationSelect.value === "") {
        weatherCard.hidden = true;
        return;
    }

    const selectedLocation =
        matchingLocations[Number(locationSelect.value)];

    if (!selectedLocation) {
        message.textContent = "Please select a valid city.";
        return;
    }

    locationSelect.disabled = true;
    searchBtn.disabled = true;
    message.textContent = "Fetching current weather...";
    weatherCard.hidden = true;

    try {
        const weatherUrl = new URL(
            "https://api.openweathermap.org/data/2.5/weather"
        );

        weatherUrl.search = new URLSearchParams({
            lat: selectedLocation.lat,
            lon: selectedLocation.lon,
            appid: API_KEY,
            units: "metric"
        });

        const response = await fetch(weatherUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to fetch weather."
            );
        }

        // Display the selected location, not a different search result.
        const state = selectedLocation.state
            ? `, ${selectedLocation.state}`
            : "";

        cityName.textContent =
            `${selectedLocation.name}${state}, India`;

        const localTime = new Date(
            (data.dt + data.timezone) * 1000
        );

        dateElement.textContent =
            new Intl.DateTimeFormat("en-IN", {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: "UTC"
            }).format(localTime);

        temperature.textContent =
            `${Math.round(data.main.temp)}°C`;

        description.textContent =
            data.weather[0].description;

        feelsLike.textContent =
            `${Math.round(data.main.feels_like)}°C`;

        humidity.textContent =
            `${data.main.humidity}%`;

        windSpeed.textContent =
            `${Math.round(data.wind.speed * 3.6)} km/h`;

        weatherIcon.src =
            `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

        weatherIcon.alt = data.weather[0].description;

        weatherCard.hidden = false;
        message.textContent = "";

    } catch (error) {
        message.textContent =
            error.message || "Unable to load weather.";
    } finally {
        locationSelect.disabled = false;
        searchBtn.disabled = false;
    }
});
