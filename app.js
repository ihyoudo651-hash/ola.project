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


// --- THE QUOTE WALL ENGINE ---
const quoteForm = document.getElementById('quote-form');
const quoteList = document.getElementById('quote-list');

function initQuoteWall() {
  // Load existing quotes or default to an empty array
  let quotes = JSON.parse(localStorage.getItem('dashboard_quotes')) || [];
  
  // Render them on startup
  renderQuotes(quotes);

  // Handle form submission
  quoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const textInput = document.getElementById('quote-input');
    const authorInput = document.getElementById('quote-author');

    const newQuote = {
      text: textInput.value.trim(),
      author: authorInput.value.trim(),
      timestamp: new Date().toLocaleDateString()
    };

    quotes.push(newQuote);
    localStorage.setItem('dashboard_quotes', JSON.stringify(quotes));
    
    renderQuotes(quotes);

    // Reset fields
    textInput.value = '';
    authorInput.value = '';
  });
}

function renderQuotes(quotes) {
  quoteList.innerHTML = '';
  
  if (quotes.length === 0) {
    quoteList.innerHTML = '<div class="quote-empty">No quotes yet. Say something unhinged.</div>';
    return;
  }

  // Render quotes in reverse order so the newest appears at the top
  quotes.slice().reverse().forEach(quote => {
    const item = document.createElement('div');
    item.className = 'quote-item';
    item.innerHTML = `
      <p class="quote-text">“${quote.text}”</p>
      <div class="quote-meta">— ${quote.author} <span class="quote-date">${quote.timestamp}</span></div>
    `;
    quoteList.appendChild(item);
  });
}


updateGreeting();
fetchWeather();
initQuoteWall();
