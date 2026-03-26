const API_BASE = 'http://localhost:5000/api';

export async function renderAdminDashboard(container) {
    container.innerHTML = `
    <div class="dashboard slide-up">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>Admin Dashboard</h2>
        <div style="display:flex; gap: 1rem;">
           <button id="btn-admin-pets" class="btn primary-btn">Manage Pets</button>
           <button id="btn-admin-apps" class="btn outline-btn">Review Applications</button>
        </div>
      </div>
      <div id="admin-view-content"></div>
    </div>
  `;

    document.getElementById('btn-admin-pets').addEventListener('click', () => loadManagePets(document.getElementById('admin-view-content')));
    document.getElementById('btn-admin-apps').addEventListener('click', () => loadReviewApps(document.getElementById('admin-view-content')));

    // Render pets by default
    loadManagePets(document.getElementById('admin-view-content'));
}

async function loadManagePets(contentDiv) {
    contentDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
      <h3>Pet Inventory</h3>
      <button class="btn success-btn" onclick="window.openAddPetModal()">+ Add New Pet</button>
    </div>
    <div id="admin-pets-list">Loading...</div>
  `;

    try {
        const res = await fetch(`${API_BASE}/pets`);
        const pets = await res.json();
        const listDiv = document.getElementById('admin-pets-list');

        if (pets.length === 0) {
            listDiv.innerHTML = '<p>No pets in inventory.</p>';
            return;
        }

        listDiv.innerHTML = pets.map(pet => `
      <div class="glass-panel" style="margin-bottom: 1rem; display: flex; align-items: center; gap: 1.5rem;">
        <img src="${pet.image || 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=500&q=80'}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
        <div style="flex:1">
          <h4 style="font-size: 1.2rem; margin-bottom:0.3rem">${pet.name}</h4>
          <p style="color:var(--text-light)">${pet.breed} - ${pet.type} | Age: ${pet.age}</p>
          <p style="font-weight: bold; color: var(--primary); margin-top: 0.5rem;">Price: ₹<span id="price-${pet.id}">${pet.price}</span></p>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem">
          <button class="btn outline-btn" onclick="window.updatePetPrice('${pet.id}')">Edit Price</button>
          <button class="btn danger-btn" onclick="window.deletePet('${pet.id}')">Remove</button>
        </div>
      </div>
    `).join('');
    } catch (e) {
        document.getElementById('admin-pets-list').innerHTML = '<p class="error-text">Failed to fetch pets.</p>';
    }
}

window.openAddPetModal = () => {
    const modalHTML = `
    <div id="add-pet-modal" class="modal">
      <div class="glass-panel">
        <button onclick="document.getElementById('add-pet-modal').remove()" class="close-btn">&times;</button>
        <h2>Add New Pet</h2>
        <form id="add-pet-form" class="auth-form">
          <input type="text" id="add-name" placeholder="Pet Name" required />
          <input type="text" id="add-type" placeholder="Type (e.g. dog, cat)" required />
          <input type="text" id="add-breed" placeholder="Breed" required />
          <input type="text" id="add-age" placeholder="Age (e.g. 2 months)" required />
          <input type="number" id="add-price" placeholder="Price in ₹" required />
          <input type="url" id="add-image" placeholder="Image URL (Optional)" />
          <button type="submit" class="btn primary-btn large">Save Pet</button>
        </form>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('add-pet-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('add-name').value,
            type: document.getElementById('add-type').value,
            breed: document.getElementById('add-breed').value,
            age: document.getElementById('add-age').value,
            price: document.getElementById('add-price').value,
            image: document.getElementById('add-image').value,
            status: 'available'
        };

        try {
            const resp = await fetch(`${API_BASE}/pets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (resp.ok) {
                document.getElementById('add-pet-modal').remove();
                document.getElementById('btn-admin-pets').click();
            }
        } catch (err) {
            alert("Error adding pet");
        }
    });
};

window.updatePetPrice = async (petId) => {
    const currentPrice = document.getElementById(`price-${petId}`).textContent;
    const newPrice = prompt(`Enter new price for this pet (Current: ₹${currentPrice}):`, currentPrice);
    if (newPrice && !isNaN(newPrice)) {
        try {
            const resp = await fetch(`${API_BASE}/pets/${petId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: Number(newPrice) })
            });
            if (resp.ok) {
                document.getElementById(`price-${petId}`).textContent = newPrice;
            }
        } catch (e) {
            alert("Error updating price");
        }
    }
};

window.deletePet = async (petId) => {
    if (confirm("Are you sure you want to remove this pet?")) {
        try {
            const resp = await fetch(`${API_BASE}/pets/${petId}`, { method: 'DELETE' });
            if (resp.ok || resp.status === 204) {
                document.getElementById('btn-admin-pets').click();
            }
        } catch (e) {
            alert("Error removing pet");
        }
    }
};

async function loadReviewApps(contentDiv) {
    contentDiv.innerHTML = `<h3>Adoption Applications</h3><div id="admin-apps-list" style="margin-top: 1.5rem;">Loading...</div>`;
    try {
        const res = await fetch(`${API_BASE}/applications`);
        const apps = await res.json();
        const listDiv = document.getElementById('admin-apps-list');

        if (apps.length === 0) {
            listDiv.innerHTML = '<p>No applications found.</p>';
            return;
        }

        listDiv.innerHTML = apps.map(app => `
      <div class="glass-panel" style="margin-bottom: 1.5rem;">
        <div style="display:flex; justify-content:space-between;">
           <h4>Applicant: ${app.name} <span style="font-weight:normal; font-size:0.9em; color:#666">(${app.email})</span></h4>
           <span style="padding:0.2rem 0.6rem; border-radius:12px; background:#f1f5f9; font-size:0.9rem; border:1px solid #cbd5e1">Status: ${app.status}</span>
        </div>
        <div style="margin-top: 1rem; display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem; font-size: 0.95rem;">
          <p><strong>Pet ID:</strong> ${app.petId}</p>
          <p><strong>Age:</strong> ${app.age} | <strong>Gender:</strong> ${app.gender}</p>
          <p><strong>Salary:</strong> ₹${app.salary}</p>
          <p><strong>Address:</strong> ${app.address}</p>
          <p style="grid-column: span 2;"><strong>Why Adopt:</strong> ${app.why_adopt}</p>
          <p style="grid-column: span 2;"><strong>Reason for Pet:</strong> ${app.reason_choose_pet}</p>
        </div>
        
        ${app.status === 'pending' ? `
          <div style="margin-top: 1.5rem; background: rgba(79, 70, 229, 0.05); padding: 1rem; border-radius: 8px;">
            <p style="margin-bottom: 0.5rem; font-weight: 600;">Admin Decision</p>
            <input type="text" id="reason-${app.id}" placeholder="Provide reasoning for acceptance/declination..." style="width:100%; padding:0.6rem; border:1px solid #cbd5e1; border-radius:6px; margin-bottom: 0.8rem;"/>
            <div style="display:flex; gap: 1rem;">
              <button class="btn success-btn" onclick="window.processApp('${app.id}', 'accepted')">Accept Application</button>
              <button class="btn danger-btn" onclick="window.processApp('${app.id}', 'declined')">Decline Application</button>
            </div>
          </div>
        ` : `<div style="margin-top:1rem; padding-top:1rem; border-top:1px solid #e2e8f0; color:var(--text-light)"><p><strong>Decision Reason:</strong> ${app.adminReason || 'N/A'}</p></div>`}
      </div>
    `).join('');
    } catch (e) {
        document.getElementById('admin-apps-list').innerHTML = '<p class="error-text">Failed to fetch applications.</p>';
    }
}

window.processApp = async (appId, status) => {
    const reasonInput = document.getElementById(`reason-${appId}`).value.trim();
    if (!reasonInput) {
        alert("You must provide a reason for this decision.");
        return;
    }

    if (confirm(`Are you sure you want to mark this as ${status}?`)) {
        try {
            const resp = await fetch(`${API_BASE}/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminReason: reasonInput })
            });
            if (resp.ok) {
                document.getElementById('btn-admin-apps').click();
            }
        } catch (e) {
            alert("Error updating application");
        }
    }
};
