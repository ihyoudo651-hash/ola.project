// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // --- LOAD EXISTING DRAWINGS ---
async function loadWhiteboard() {
  const { data: lines, error } = await supabaseClient
    .from('whiteboard')
    .select('*')
    .order('created_at', { ascending: true }); // Ascending ensures lines draw in the exact order they were made

  if (error) {
    console.error("Error loading whiteboard:", error);
    return;
  }

  if (lines) {
    lines.forEach(line => {
      drawLine(line.x1, line.y1, line.x2, line.y2);
    });
  }
}
  updateGreeting();
  fetchWeather();
  initQuoteWall();
  initWhiteboard();
});

// --- GREETING & WEATHER ---
function updateGreeting() {
  const greetingElement = document.getElementById('greeting');
  const hours = new Date().getHours();
  if (hours < 12) greetingElement.textContent = 'Good Morning - Pukka Mandem';
  else if (hours < 18) greetingElement.textContent = 'Good Afternoon - Pukka Mandem';
  else greetingElement.textContent = 'Good Evening - Pukka Mandem';
}

async function fetchWeather() {
  try {
    const response = await fetch(`https://wttr.in/Manchester?format=j1`);
    const data = await response.json();
    const current = data.current_condition[0];
    document.getElementById('weather-desc').innerText = current.weatherDesc[0].value;
    document.getElementById('weather-temp').innerText = `${current.temp_C}°C`;
  } catch (error) {
    document.getElementById('weather-desc').innerText = "Failed to load weather.";
  }
}

// --- SUPABASE SETUP ---
const SUPABASE_URL = "https://itfmvbsrvroructmeirx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Zm12YnNydnJvcnVjdG1laXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjUxMzUsImV4cCI6MjA5NzAwMTEzNX0.Bzj_khBMZXpkOLOrOsWpDK112_lKSeArVqNS_YFonm8";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- QUOTE WALL ---
async function initQuoteWall() {
  const quoteForm = document.getElementById('quote-form');
  const quoteList = document.getElementById('quote-list');
  await fetchQuotesFromDatabase(quoteList);

  quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textInput = document.getElementById('quote-input');
    const authorInput = document.getElementById('quote-author');
    await supabaseClient.from('quotes').insert([{ text: textInput.value.trim(), author: authorInput.value.trim() }]);
    textInput.value = ''; authorInput.value = '';
    await fetchQuotesFromDatabase(quoteList);
  });
}

async function fetchQuotesFromDatabase(quoteList) {
  const { data: quotes } = await supabaseClient.from('quotes').select('*').order('created_at', { ascending: false });
  quoteList.innerHTML = quotes?.length ? '' : '<div class="quote-empty">No quotes yet.</div>';
  quotes?.forEach(quote => {
    const item = document.createElement('div');
    item.className = 'quote-item';
    item.innerHTML = `<p class="quote-text">“${quote.text}”</p><div class="quote-meta">— ${quote.author}</div>`;
    quoteList.appendChild(item);
  });
}

// --- WHITEBOARD ---
function initWhiteboard() {
  const canvas = document.getElementById('whiteboard');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let lastX = 0, lastY = 0;

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  canvas.addEventListener('mousedown', (e) => { drawing = true; [lastX, lastY] = [e.offsetX, e.offsetY]; });
  canvas.addEventListener('mousemove', async (e) => {
    if (!drawing) return;
    drawLine(lastX, lastY, e.offsetX, e.offsetY);
    await supabaseClient.from('whiteboard').insert([{ x1: lastX, y1: lastY, x2: e.offsetX, y2: e.offsetY }]);
    [lastX, lastY] = [e.offsetX, e.offsetY];
  });
  canvas.addEventListener('mouseup', () => drawing = false);

  supabaseClient.channel('whiteboard')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whiteboard' }, payload => {
      const { x1, y1, x2, y2 } = payload.new;
      drawLine(x1, y1, x2, y2);
    })
    .subscribe();
}
