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

// --- SUPABASE SETUP ---
const SUPABASE_URL = "https://itfmvbsrvroructmeirx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Zm12YnNydnJvcnVjdG1laXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjUxMzUsImV4cCI6MjA5NzAwMTEzNX0.Bzj_khBMZXpkOLOrOsWpDK112_lKSeArVqNS_YFonm8"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const quoteForm = document.getElementById('quote-form');
const quoteList = document.getElementById('quote-list');

async function initQuoteWall() {
  await fetchQuotesFromDatabase();

  quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const textInput = document.getElementById('quote-input');
    const authorInput = document.getElementById('quote-author');

    const quoteText = textInput.value.trim();
    const quoteAuthor = authorInput.value.trim();

 
    const { error } = await supabaseClient
      .from('quotes')
      .insert([{ text: quoteText, author: quoteAuthor }]);

    if (error) {
      console.error("Error saving quote:", error);
      alert("Failed to save quote to the wall.");
    } else {
      textInput.value = '';
      authorInput.value = '';
      await fetchQuotesFromDatabase();
    }
  });
}

async function fetchQuotesFromDatabase() {
  const { data: quotes, error } = await supabaseClient
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching quotes:", error);
    quoteList.innerHTML = '<div class="quote-empty">Error connecting to the Quote Wall database.</div>';
    return;
  }

  quoteList.innerHTML = '';
  
  if (!quotes || quotes.length === 0) {
    quoteList.innerHTML = '<div class="quote-empty">No quotes yet. Say something unhinged.</div>';
    return;
  }

  quotes.forEach(quote => {
    const item = document.createElement('div');
    item.className = 'quote-item';
    
    const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString() : '';

   
    item.innerHTML = `
      <p class="quote-text">“${quote.text}”</p>
      <div class="quote-meta">— ${quote.author} <span class="quote-date">${dateStr}</span></div>
    `;
    quoteList.appendChild(item);
  });
}

// Ensure the DOM is fully loaded before running whiteboard logic
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('whiteboard');
  if (!canvas) return; // Exit if canvas isn't found
  
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
  });

  canvas.addEventListener('mousemove', async (e) => {
    if (!drawing) return;
    const currentX = e.offsetX;
    const currentY = e.offsetY;

    drawLine(lastX, lastY, currentX, currentY);

    await supabaseClient.from('whiteboard').insert([{
      x1: lastX, y1: lastY, x2: currentX, y2: currentY
    }]);

    [lastX, lastY] = [currentX, currentY];
  });

  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('mouseleave', () => drawing = false);

  // Real-time listener
  supabaseClient
    .channel('whiteboard')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whiteboard' }, payload => {
      const { x1, y1, x2, y2 } = payload.new;
      drawLine(x1, y1, x2, y2);
    })
    .subscribe((status) => {
      console.log("Whiteboard subscription status:", status);
    });
});

updateGreeting();
fetchWeather();
initQuoteWall();
