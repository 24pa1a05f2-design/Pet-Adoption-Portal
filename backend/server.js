import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import admin from 'firebase-admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

import admin from 'firebase-admin';

// Initialize Firebase Admin (Optional, will fallback if not configured)
let db = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT env var missing. Falling back to mock data.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
}

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Pet Adoption API running' });
});

// Mocked DB for currently available pets
let pets = [
  { id: '1', name: 'Buddy', type: 'dog', breed: 'Golden Retriever', age: '2 years', price: 5000, image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&q=80', status: 'available' },
  { id: '2', name: 'Mittens', type: 'cat', breed: 'Persian', age: '1 year', price: 3500, image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80', status: 'available' },
  { id: '3', name: 'Tweety', type: 'bird', breed: 'Canary', age: '6 months', price: 1200, image: 'https://images.unsplash.com/photo-1522276498395-f481a5f4dcdd?w=500&q=80', status: 'available' },
  { id: '4', name: 'Thumper', type: 'rabbit', breed: 'Holland Lop', age: 'Unknown', price: 2000, image: 'https://images.unsplash.com/photo-1504958045647-7505199173f0?w=500&q=80', status: 'available' },
];

let applications = []; // Mock applications

app.get('/api/pets', async (req, res) => {
  try {
    if (db) {
      // This only runs if you have a real Firebase Database
      const snapshot = await db.collection('pets').get();
      const petList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(petList);
    } else {
      // --- THIS IS THE MISSING PIECE ---
      // If there is no DB, we MUST send the mock pets array
      console.log("No DB found, sending mock pets list");
      return res.json(pets); 
    }
  } catch (e) {
    console.error("Error:", e);
    return res.status(500).json({ error: 'Failed to fetch pets' });
  }
});

app.post('/api/pets', async (req, res) => {
  const newPet = { ...req.body };
  if (db) {
    try {
      const docRef = await db.collection('pets').add(newPet);
      return res.status(201).json({ id: docRef.id, ...newPet });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to add pet' });
    }
  }
  newPet.id = Date.now().toString();
  pets.push(newPet);
  res.status(201).json(newPet);
});

app.patch('/api/pets/:id', async (req, res) => {
  const { id } = req.params;
  if (db) {
    try {
      await db.collection('pets').doc(id).update(req.body);
      return res.json({ id, ...req.body });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update pet' });
    }
  }
  const index = pets.findIndex(p => p.id === id);
  if (index !== -1) {
    pets[index] = { ...pets[index], ...req.body };
    res.json(pets[index]);
  } else {
    res.status(404).json({ error: 'Pet not found' });
  }
});

app.delete('/api/pets/:id', async (req, res) => {
  const { id } = req.params;
  if (db) {
    try {
      await db.collection('pets').doc(id).delete();
      return res.status(204).send();
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete' });
    }
  }
  pets = pets.filter(p => p.id !== id);
  res.status(204).send();
});

app.post('/api/applications', async (req, res) => {
  const application = { ...req.body, status: 'pending', createdAt: Date.now() };
  if (db) {
    try {
      const docRef = await db.collection('applications').add(application);
      return res.status(201).json({ id: docRef.id, ...application });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to submit application' });
    }
  }
  application.id = Date.now().toString();
  applications.push(application);
  res.status(201).json(application);
});

app.get('/api/applications', async (req, res) => {
  if (db) {
    try {
      const snapshot = await db.collection('applications').get();
      const appList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(appList);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch' });
    }
  }
  res.json(applications);
});

app.patch('/api/applications/:id', async (req, res) => {
  const { id } = req.params;
  const { status, adminReason } = req.body;

  if (db) {
    try {
      await db.collection('applications').doc(id).update({ status, adminReason });
      return res.json({ id, status, adminReason });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update application' });
    }
  }

  const index = applications.findIndex(a => a.id === id);
  if (index !== -1) {
    applications[index] = { ...applications[index], status, adminReason };
    res.json(applications[index]);
  } else {
    res.status(404).json({ error: 'Application not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
