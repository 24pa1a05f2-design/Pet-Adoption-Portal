import { currentUser } from './auth.js';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export async function renderUserDashboard(container) {
  container.innerHTML = `
    <div class="dashboard slide-up">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>Available Pets for Adoption</h2>
        <div style="display:flex; gap: 1rem;">
           <button id="btn-browse" class="btn primary-btn">Browse Pets</button>
           <button id="btn-my-apps" class="btn outline-btn">My Applications</button>
        </div>
      </div>
      
      <div id="user-view-content"></div>
    </div>
  `;

  document.getElementById('btn-browse').addEventListener('click', () => loadPets(document.getElementById('user-view-content')));
  document.getElementById('btn-my-apps').addEventListener('click', () => loadMyApplications(document.getElementById('user-view-content')));

  // Load pets by default
  loadPets(document.getElementById('user-view-content'));
}

async function loadPets(contentDiv) {
  contentDiv.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <input type="text" id="search-pets" placeholder="Search by name, breed, or type..." style="max-width: 400px; margin-bottom: 1rem;">
    </div>
    <div id="pets-grid" class="grid">Loading pets...</div>
  `;

  try {
    const res = await fetch(`${API_BASE}/pets`);
    const pets = await res.json();
    const grid = document.getElementById('pets-grid');
    const searchInput = document.getElementById('search-pets');

    const renderGrid = (list) => {
      grid.innerHTML = list.length === 0 ? '<p>No pets found.</p>' : list.map(pet => `
        <div class="card">
          <img src="${pet.image || 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=500&q=80'}" alt="${pet.name}">
          <div class="card-body">
            <h3 class="card-title">${pet.name}</h3>
            <p style="color: var(--text-light); text-transform: capitalize; margin-bottom: 0.5rem;">${pet.breed} - ${pet.type}</p>
            <p><strong>Age:</strong> ${pet.age}</p>
            <div style="margin-top: auto; padding-top: 1rem;">
              <p class="card-price">₹${pet.price}</p>
              <button class="btn primary-btn" style="width: 100%" onclick="window.openAdoptionForm('${pet.id}', '${pet.name}')">Apply for Adoption</button>
            </div>
          </div>
        </div>
      `).join('');
    };

    renderGrid(pets);

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = pets.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
      );
      renderGrid(filtered);
    });

  } catch (error) {
    document.getElementById('pets-grid').innerHTML = `<p class="error-text">Failed to load pets. Server offline.</p>`;
  }
}

// Global function to trigger form modal
window.openAdoptionForm = (petId, petName) => {
  const modalHTML = `
    <div id="adoption-modal" class="modal">
      <div class="glass-panel" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
        <button onclick="document.getElementById('adoption-modal').remove()" class="close-btn">&times;</button>
        <h2 style="margin-bottom: 1.5rem">Adopt ${petName}</h2>
        <form id="adoption-form" class="auth-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <input type="text" id="app-name" placeholder="Full Name" required style="grid-column: span 2"/>
          <input type="number" id="app-age" placeholder="Age" required />
          <select id="app-gender" required>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input type="email" id="app-email" placeholder="Email Address" required style="grid-column: span 2"/>
          <input type="text" id="app-address" placeholder="Home Address" required style="grid-column: span 2"/>
          <input type="number" id="app-salary" placeholder="Monthly Salary (₹)" required style="grid-column: span 2"/>
          <textarea id="app-why" placeholder="Why do you want to adopt a pet?" required style="grid-column: span 2; min-height: 80px;"></textarea>
          <textarea id="app-reason" placeholder="Reason for choosing this specific pet?" required style="grid-column: span 2; min-height: 80px;"></textarea>
          <input type="hidden" id="app-petid" value="${petId}" />
          
          <button type="submit" class="btn primary-btn large" style="grid-column: span 2; margin-top: 1rem;">Submit Application</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.getElementById('adoption-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      userId: currentUser?.uid || 'anonymous',
      petId: document.getElementById('app-petid').value,
      name: document.getElementById('app-name').value,
      age: document.getElementById('app-age').value,
      gender: document.getElementById('app-gender').value,
      email: document.getElementById('app-email').value,
      address: document.getElementById('app-address').value,
      salary: document.getElementById('app-salary').value,
      why_adopt: document.getElementById('app-why').value,
      reason_choose_pet: document.getElementById('app-reason').value
    };

    try {
      const resp = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        alert("Application submitted successfully!");
        document.getElementById('adoption-modal').remove();
        document.getElementById('btn-my-apps').click();
      } else {
        alert("Server error processing application.");
      }
    } catch (err) {
      alert("Failed to connect to server.");
    }
  });
};

async function loadMyApplications(contentDiv) {
  contentDiv.innerHTML = `<h3>Your Applications</h3><div id="apps-list" style="margin-top: 1.5rem;">Loading...</div>`;
  try {
    const res = await fetch(`${API_BASE}/applications`);
    const allApps = await res.json();
    const uid = currentUser?.uid || 'anonymous';
    const myApps = allApps.filter(a => a.userId === uid);

    const appsList = document.getElementById('apps-list');
    if (myApps.length === 0) {
      appsList.innerHTML = '<p>You have not applied for any pets yet.</p>';
      return;
    }

    appsList.innerHTML = myApps.map(app => {
      let statusColor = '#f59e0b'; // pending
      if (app.status === 'accepted') statusColor = '#10b981';
      if (app.status === 'declined') statusColor = '#ef4444';

      return `
        <div class="glass-panel" style="margin-bottom: 1rem; width: 100%; max-width: 100%; border-left: 5px solid ${statusColor}">
          <div style="display:flex; justify-content: space-between; align-items: start;">
             <div>
               <h4 style="margin-bottom:0.5rem">Application for Pet ID: ${app.petId}</h4>
               <p><strong>Status:</strong> <span style="color: ${statusColor}; text-transform: capitalize; font-weight: bold;">${app.status}</span></p>
               ${app.adminReason ? `<p style="margin-top:0.5rem; background:rgba(0,0,0,0.05); padding:0.5rem; border-radius:4px;"><strong>Admin Feedback:</strong> ${app.adminReason}</p>` : ''}
             </div>
             <div>
               ${app.status === 'accepted' ? `<button class="btn success-btn" onclick="window.openPayment('${app.petId}')">Proceed to Payment</button>` : ''}
             </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    document.getElementById('apps-list').innerHTML = `<p class="error-text">Failed to load applications.</p>`;
  }
}

// Global payment function
window.openPayment = (petId) => {
  const modalHTML = `
    <div id="payment-modal" class="modal" style="display:-webkit-box;display:-ms-flexbox;display:flex">
      <div class="glass-panel" style="max-width: 500px; padding: 2rem; border-radius: 24px; animation: slideUp 0.4s ease-out;">
        <button onclick="document.getElementById('payment-modal').remove()" class="close-btn">&times;</button>
        <div style="text-align:center; margin-bottom:1.5rem;">
            <div style="width:60px; height:60px; background:var(--primary-light, #e0e7ff); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:1rem; color:var(--primary); font-size:1.8rem;">💳</div>
            <h2 style="font-size:1.8rem; font-weight:800; margin-bottom:0.3rem;">Secure Checkout</h2>
            <p style="color: var(--text-light); font-size: 0.95rem;">Complete your pet adoption</p>
        </div>
        
        <div class="payment-tabs" style="display:flex; gap:0.5rem; margin-bottom: 1.5rem; background:#f1f5f9; padding:0.4rem; border-radius:12px;">
            <button class="pay-tab active" data-target="upi" style="flex:1; padding:0.6rem; border:none; background:white; border-radius:8px; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.05); cursor:pointer;">UPI / QR</button>
            <button class="pay-tab" data-target="card" style="flex:1; padding:0.6rem; border:none; background:transparent; color:var(--text-light); border-radius:8px; font-weight:600; cursor:pointer;">Card</button>
        </div>
        
        <form id="payment-form" class="auth-form" style="margin: 0;">
          <!-- UPI Section -->
          <div id="pay-upi" class="pay-method-content slide-up" style="text-align:center;">
             <div style="background:white; padding:1.5rem; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:1rem;">
                <p style="font-size:0.9rem; color:var(--text-light); margin-bottom:1rem;">Scan with any UPI app</p>
                <div style="width:150px; height:150px; background:#f8fafc; margin:0 auto; display:flex; align-items:center; justify-content:center; border:2px dashed #cbd5e1; border-radius:12px;">
                    <span style="font-size:3rem;">📱</span>
                </div>
                <p style="margin-top:1rem; font-weight:600; color:var(--text-dark);">Or enter UPI ID</p>
                <input type="text" id="upi-id" placeholder="example@okhdfcbank" style="margin-top:0.5rem;" />
             </div>
          </div>
          
          <!-- Card Section -->
          <div id="pay-card" class="pay-method-content hidden" style="background:white; padding:1.5rem; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:1rem;">
             <input type="text" placeholder="Cardholder Name" style="margin-bottom:1rem;" />
             <input type="text" placeholder="0000 0000 0000 0000" style="margin-bottom:1rem; font-family:monospace; font-size:1.1rem; letter-spacing:2px;" />
             <div style="display:flex; gap:1rem;">
                <input type="text" placeholder="MM/YY" style="flex:1;" />
                <input type="password" placeholder="CVV" style="flex:1;" maxlength="3" />
             </div>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; padding: 1rem 0; border-top:1px dashed #cbd5e1; margin-top:0.5rem;">
             <span style="color:var(--text-light);">Total Amount</span>
             <span style="font-size:1.4rem; font-weight:800; color:var(--text-dark);">₹Processing...</span>
          </div>

          <button id="btn-pay-submit" type="submit" class="btn primary-btn large" style="width:100%; border-radius:12px; padding:1rem; font-size:1.1rem; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
             Confirm Payment <span style="font-size:1.2rem;">→</span>
          </button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Tab switching logic
  const tabs = document.querySelectorAll('.pay-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.boxShadow = 'none';
        t.style.color = 'var(--text-light)';
      });
      tab.classList.add('active');
      tab.style.background = 'white';
      tab.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
      tab.style.color = 'var(--text-dark)';

      const target = tab.getAttribute('data-target');
      document.getElementById('pay-upi').classList.toggle('hidden', target !== 'upi');
      document.getElementById('pay-card').classList.toggle('hidden', target !== 'card');
    });
  });

  document.getElementById('payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-pay-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Processing... ⏳';
    btn.disabled = true;
    btn.style.opacity = '0.8';

    // Simulate network delay for real feel
    setTimeout(() => {
      btn.innerHTML = 'Success! 🎉';
      btn.classList.replace('primary-btn', 'success-btn');
      setTimeout(() => {
        document.getElementById('payment-modal').remove();
        // Optionally auto-refresh apps list to show updated state if needed
        document.getElementById('btn-my-apps').click();
      }, 1000);
    }, 1500);
  });
};
