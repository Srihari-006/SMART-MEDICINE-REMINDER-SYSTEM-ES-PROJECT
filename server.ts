import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { initializeApp as initializeAdminApp, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase SDK (Client)
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8'));
const clientApp = initializeClientApp(firebaseConfig);
const db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Admin SDK
const adminApp = initializeAdminApp({
  projectId: firebaseConfig.projectId
});
const adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES FIRST ---

  // ESP32 Friendly API View
  app.get('/api/esp32/config/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      console.log(`ESP32 Request: Fetching config for UID: ${uid}`);
      
      // Update device status to online
      await adminDb.collection('device_status').doc(uid).set({
        isOnline: true,
        lastSeen: new Date().toISOString(),
        caregiverUid: uid
      }, { merge: true });
      console.log(`Device status updated for UID: ${uid}`);

      // Fetch meal times
      const mealTimesDoc = await getDoc(doc(db, 'meal_times', uid));
      const mealTimes = mealTimesDoc.exists() ? mealTimesDoc.data() : null;

      // Fetch medicines
      const q = query(collection(db, 'medicines'), where('caregiverUid', '==', uid));
      const medicinesSnap = await getDocs(q);
      const medicines = medicinesSnap.docs.map(doc => {
        const data = doc.data();
        const mealTime = mealTimes?.[data.slot as keyof typeof mealTimes];
        return {
          name: data.name,
          dosage: data.dosage,
          slot: data.slot,
          food_instruction: data.food_instruction,
          calculatedTime: data.calculatedTime,
          status: data.status || (mealTime ? 'active' : 'pending')
        };
      });

      // Fetch sync flag
      const deviceStatusDoc = await getDoc(doc(db, 'device_status', uid));
      const sync = deviceStatusDoc.exists() ? deviceStatusDoc.data()?.sync : false;

      const fallbackTimes = {
        breakfast: "08:00",
        lunch: "13:00",
        dinner: "20:00"
      };

      res.json({
        meal_times: {
          breakfast: mealTimes?.breakfast || fallbackTimes.breakfast,
          lunch: mealTimes?.lunch || fallbackTimes.lunch,
          dinner: mealTimes?.dinner || fallbackTimes.dinner
        },
        medicines,
        sync
      });
    } catch (error) {
      console.error('Error fetching config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ESP32 Log Endpoint
  app.post('/api/esp32/log', async (req, res) => {
    try {
      const { caregiverUid, slot, instruction, status } = req.body;
      console.log(`ESP32 Request: Logging ${status} for ${slot} (${instruction}) (UID: ${caregiverUid})`);
      
      if (!caregiverUid || !slot || !status) {
        console.warn('ESP32 Log Request failed: Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Add log to Firestore using Admin SDK
      const logRef = await adminDb.collection('logs').add({
        caregiverUid,
        slot,
        instruction: instruction || 'after',
        status,
        timestamp: new Date().toISOString()
      });

      // Update medicine status in Firestore if taken
      if (status === 'taken') {
        const medsSnapshot = await adminDb.collection('medicines')
          .where('caregiverUid', '==', caregiverUid)
          .where('slot', '==', slot)
          .where('food_instruction', '==', instruction || 'after')
          .get();
        
        const batch = adminDb.batch();
        medsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, { status: 'taken' });
        });
        await batch.commit();
      }

      console.log(`Log added from ESP32: ${logRef.id} (Status: ${status})`);
      res.json({ success: true, id: logRef.id });
    } catch (error) {
      console.error('Error adding log from ESP32:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ESP32 Synced Endpoint
  app.post('/api/esp32/synced/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      await adminDb.collection('device_status').doc(uid).update({ sync: false });
      console.log(`Sync flag reset for UID: ${uid}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting sync flag:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- MIDDLEWARE & STATIC SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
