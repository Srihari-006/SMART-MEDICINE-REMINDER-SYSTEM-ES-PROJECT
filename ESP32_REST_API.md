# ESP32 Firestore REST API Integration Guide

This application uses **Cloud Firestore** exclusively for data storage. The ESP32 can communicate with Firestore directly using the HTTPS REST API or via the **Simplified Proxy API** provided by this server.

## 🚀 0. Simplified Proxy API (Recommended)
This server provides a simplified JSON endpoint that aggregates all configuration for the ESP32.

**Endpoint:** `GET /api/esp32/config/{CAREGIVER_UID}`

**Response Example:**
```json
{
  "meal_times": {
    "breakfast": "08:00",
    "lunch": "13:00",
    "dinner": "20:00"
  },
  "medicines": [
    {
      "name": "Aspirin",
      "dosage": "500mg",
      "slot": "breakfast",
      "food_instruction": "before"
    }
  ],
  "sync": true
}
```
*Note: The `sync` flag will be `true` if the caregiver has updated the configuration and wants the device to refresh.*

---

## 🔑 Direct Firestore REST API (Alternative)
If you prefer to call Firestore directly:
The ESP32 must include the Firebase API Key in the `x-goog-api-key` header or as a query parameter `key`.

**API Key:** `AIzaSyB3JUf_oug1uoTBUXkMzcI-kX9YKaMvqCg`

## 🌐 Base URL
`https://firestore.googleapis.com/v1/projects/gen-lang-client-0436929028/databases/ai-studio-b322c645-886b-453d-9e21-cbb6d92c9035/documents`

---

## 🍽️ 1. Fetch Meal Times
**Endpoint:** `GET /meal_times/{CAREGIVER_UID}`

**Example Request:**
`GET https://firestore.googleapis.com/v1/projects/gen-lang-client-0436929028/databases/ai-studio-b322c645-886b-453d-9e21-cbb6d92c9035/documents/meal_times/{CAREGIVER_UID}?key=AIzaSyB3JUf_oug1uoTBUXkMzcI-kX9YKaMvqCg`

---

## 💊 2. Fetch Medicines
**Endpoint:** `GET /medicines?filter=...` (Use structuredQuery for filtering by caregiverUid)

**Example Request (List all):**
`GET https://firestore.googleapis.com/v1/projects/gen-lang-client-0436929028/databases/ai-studio-b322c645-886b-453d-9e21-cbb6d92c9035/documents/medicines?key=AIzaSyB3JUf_oug1uoTBUXkMzcI-kX9YKaMvqCg`

---

## 📝 3. Send Logs
**Endpoint:** `POST /logs`

**Payload Example:**
```json
{
  "fields": {
    "slot": { "stringValue": "breakfast" },
    "status": { "stringValue": "taken" },
    "timestamp": { "stringValue": "2026-04-02T18:30:00Z" },
    "medicineName": { "stringValue": "Aspirin" },
    "foodInstruction": { "stringValue": "before" },
    "caregiverUid": { "stringValue": "{CAREGIVER_UID}" }
  }
}
```

---

## 💓 4. Update Device Status (Heartbeat)
**Endpoint:** `PATCH /device_status/{CAREGIVER_UID}?updateMask.fieldPaths=isOnline&updateMask.fieldPaths=lastSeen`

**Payload Example:**
```json
{
  "fields": {
    "isOnline": { "booleanValue": true },
    "lastSeen": { "stringValue": "2026-04-02T18:35:00Z" }
  }
}
```

---

## ⚠️ Important Notes
1. **HTTPS Only:** ESP32 must use an SSL client (e.g., `WiFiClientSecure`).
2. **JSON Parsing:** Use `ArduinoJson` library to parse the Firestore response format (which uses typed fields like `stringValue`, `booleanValue`, etc.).
3. **No Realtime Database:** Ensure no `firebase-database` libraries are used on the ESP32.
