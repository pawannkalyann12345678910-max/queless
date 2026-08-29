// Initialize Lucide icons
lucide.createIcons();

// Elements
const viewSearch = document.getElementById('view-search');
const viewResults = document.getElementById('view-results');
const viewBooking = document.getElementById('view-booking');
const viewSuccess = document.getElementById('view-success');

const searchForm = document.getElementById('search-form');
const bookingForm = document.getElementById('booking-form');
const flightsContainer = document.getElementById('flights-container');

// Search Inputs
const inputFrom = document.getElementById('input-from');
const inputTo = document.getElementById('input-to');
const inputDate = document.getElementById('input-date');

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
inputDate.min = today;
inputDate.value = today;

// Selected Data
let searchData = {};
let selectedFlight = null;
let selectedClass = null;

// Mock Flight Data Generator
function generateMockFlights(from, to) {
  const airlines = ['AeroLuxe Prime', 'SkyHigh Elite', 'Nova Air', 'Apex Jet'];
  const times = [
    { dep: '08:00 AM', arr: '10:30 AM', dur: '2h 30m' },
    { dep: '11:15 AM', arr: '02:00 PM', dur: '2h 45m' },
    { dep: '03:45 PM', arr: '06:10 PM', dur: '2h 25m' },
    { dep: '07:30 PM', arr: '10:00 PM', dur: '2h 30m' },
  ];

  return times.map((t, i) => {
    const basePrice = Math.floor(Math.random() * 200) + 150;
    return {
      id: `FL-${1000 + i}`,
      airline: airlines[i],
      ...t,
      classes: {
        economy: { name: 'Economy', price: basePrice, seats: Math.floor(Math.random() * 20) + 5 },
        business: { name: 'Business', price: basePrice * 2.5, seats: Math.floor(Math.random() * 8) + 2 },
        first: { name: 'First Class', price: basePrice * 4, seats: Math.floor(Math.random() * 4) + 1 },
      }
    };
  });
}

// View Management
function hideAllViews() {
  [viewSearch, viewResults, viewBooking, viewSuccess].forEach(view => {
    view.classList.add('hidden-view');
    view.classList.remove('fade-in-up', 'slide-in-right');
  });
}

function showView(viewId, animation = 'fade-in-up') {
  hideAllViews();
  const view = document.getElementById(viewId);
  view.classList.remove('hidden-view');
  
  // Re-trigger animation
  view.style.animation = 'none';
  view.offsetHeight; // trigger reflow
  view.style.animation = null;
  view.classList.add(animation);
}

// Swap Locations
window.swapLocations = function() {
  const temp = inputFrom.value;
  inputFrom.value = inputTo.value;
  inputTo.value = temp;
  
  // Animate swap
  const swapBtn = document.querySelector('button[onclick="swapLocations()"] i');
  swapBtn.style.transform = 'rotate(180deg)';
  setTimeout(() => swapBtn.style.transform = 'rotate(0deg)', 300);
};

// Render Flights
function renderFlights(flights) {
  flightsContainer.innerHTML = '';
  
  flights.forEach((flight, index) => {
    const delayClass = `delay-${(index % 3 + 1) * 100}`;
    
    const card = document.createElement('div');
    card.className = `glass-panel rounded-2xl p-6 flight-card fade-in-up ${delayClass}`;
    
    card.innerHTML = `
      <div class="flex flex-col lg:flex-row justify-between items-center gap-6">
        
        <!-- Flight Info -->
        <div class="flex-1 w-full grid grid-cols-3 items-center gap-4">
          <div class="text-center md:text-left">
            <h3 class="text-2xl font-bold text-white">${flight.dep}</h3>
            <p class="text-brand-400 font-medium">${searchData.from.substring(0, 3).toUpperCase()}</p>
          </div>
          
          <div class="flex flex-col items-center justify-center px-4">
            <p class="text-xs text-slate-400 mb-1">${flight.dur}</p>
            <div class="w-full h-px bg-slate-600 relative flex justify-center items-center">
              <i data-lucide="plane" class="w-4 h-4 text-brand-500 absolute bg-[#020617] px-1"></i>
            </div>
            <p class="text-xs text-brand-500 mt-1">Non-stop</p>
          </div>
          
          <div class="text-center md:text-right">
            <h3 class="text-2xl font-bold text-white">${flight.arr}</h3>
            <p class="text-brand-400 font-medium">${searchData.to.substring(0, 3).toUpperCase()}</p>
          </div>
        </div>
        
        <!-- Divider -->
        <div class="hidden lg:block w-px h-24 bg-white/10 mx-4"></div>
        <div class="block lg:hidden w-full h-px bg-white/10 my-2"></div>
        
        <!-- Classes -->
        <div class="flex-1 w-full grid grid-cols-3 gap-3">
          ${Object.entries(flight.classes).map(([key, cls]) => `
            <button onclick="selectFlight('${flight.id}', '${key}')" class="flex flex-col items-center justify-center p-3 rounded-xl border ${key === 'economy' ? 'border-white/10 bg-white/5 hover:bg-white/10' : key === 'business' ? 'border-brand-500/30 bg-brand-900/20 hover:bg-brand-900/40 text-brand-100' : 'border-amber-500/30 bg-amber-900/20 hover:bg-amber-900/40 text-amber-100'} transition-all group relative overflow-hidden">
              <span class="text-xs font-semibold mb-1 uppercase tracking-wider">${cls.name}</span>
              <span class="text-lg font-bold">$${cls.price}</span>
              <span class="text-[10px] opacity-60 mt-1">${cls.seats} seats left</span>
              
              <!-- Hover effect overlay -->
              <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400">
        <i data-lucide="shield-check" class="w-4 h-4 text-brand-500"></i>
        <span>Operated by ${flight.airline} • Free cancellation within 24h</span>
      </div>
    `;
    
    flightsContainer.appendChild(card);
  });
  
  // Re-initialize icons for new elements
  lucide.createIcons();
}

// Global Flight Selection Handler
window.selectFlight = function(flightId, classKey) {
  selectedFlight = flightId;
  selectedClass = classKey;
  
  // Find flight details for display
  const flights = Array.from(flightsContainer.children); // Just need data, but we don't store it globally.
  // We can just mock the display data based on DOM or regenerate it, but better to just use random price for UI mock since it's a demo.
  
  // Mock finding price
  let price = classKey === 'economy' ? 450 : classKey === 'business' ? 1125 : 1800;
  let className = classKey === 'economy' ? 'Economy' : classKey === 'business' ? 'Business' : 'First Class';
  
  document.getElementById('book-flight-info').innerText = `Flight ${flightId} • ${className}`;
  document.getElementById('book-flight-price').innerText = `$${price}`;
  
  showView('view-booking', 'slide-in-right');
};

// Form Submissions
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  searchData = {
    from: inputFrom.value,
    to: inputTo.value,
    date: inputDate.value
  };
  
  document.getElementById('res-from').innerText = searchData.from;
  document.getElementById('res-to').innerText = searchData.to;
  
  const dateObj = new Date(searchData.date);
  document.getElementById('res-date').innerText = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const flights = generateMockFlights(searchData.from, searchData.to);
  renderFlights(flights);
  
  showView('view-results');
});

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Show loading state on button
  const btn = bookingForm.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>Processing...</span>`;
  lucide.createIcons();
  
  // Simulate API call
  setTimeout(() => {
    btn.innerHTML = originalText;
    showView('view-success');
    lucide.createIcons();
  }, 1500);
});

window.resetApp = function() {
  searchForm.reset();
  bookingForm.reset();
  inputDate.value = today;
  showView('view-search');
};
