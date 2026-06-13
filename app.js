// 1. Dynamic Greeting based on time of day
function updateGreeting() {
  const greetingElement = document.getElementById('greeting');
  const hours = new Date().getHours();
  
  if (hours < 12) {
    greetingElement.textContent = 'Good Morning - Pukka Mandem';
  } else if (hours < 18) {
    greetingElement.textContent = 'Good Afternoon - Pukka Mandem';
  } else {
    greetingElement.textContent = 'Good Evening - Pukka Mandem';
  }
}

// 2. Real Weather API Fetcher
async function fetchWeather() {
  try {
    const city = 'Manchester';
    const response = await fetch(`https://wttr.in/${city}?format=j1`);
    const data = await response.json();
    
    const currentCondition = data.current_condition[0];
    const tempC = currentCondition.temp_C;
    const weatherDesc = currentCondition.weatherDesc[0].value;

    document.getElementById('weather-desc').innerText = weatherDesc;
    document.getElementById('weather-temp').innerText = `${tempC}°C`;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    document.getElementById('weather-desc').innerText = "Failed to load weather.";
  }
}

// 3. Live Diary with LocalStorage Persistence
const diaryTextArea = document.getElementById('live-diary');

function initDiary() {
  const savedDiary = localStorage.getItem('dashboard_diary_entry');
  if (savedDiary) {
    diaryTextArea.value = savedDiary;
  }

  diaryTextArea.addEventListener('input', (e) => {
    localStorage.setItem('dashboard_diary_entry', e.target.value);
  });
}

// Initialize Dashboard Applications
updateGreeting();
fetchWeather();
initDiary();