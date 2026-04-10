# 💊 Smart Medicine Reminder System

An IoT-based Smart Medicine Reminder System designed to help elderly patients take medicines on time and allow caregivers to monitor adherence remotely.

---

## 🚀 Features

- ⏰ Real-time medicine reminders using RTC
- 🍽️ Before/After food scheduling (Breakfast, Lunch, Dinner)
- 🔔 Buzzer and LED alerts for reminders
- 📦 Reed switch-based medicine intake detection
- ☁️ Cloud integration using Firebase
- 📊 Caregiver dashboard for monitoring
- 📡 WiFi-based remote communication

---

## 🧠 System Overview

The system consists of:
- **Hardware Unit (ESP32 + Sensors)**
- **Web Dashboard (for caregiver)**

The caregiver sets meal timings and medicine schedules through a website. The ESP32 fetches this data, calculates reminder times, and alerts the patient. Medicine intake is confirmed using a reed switch mechanism.

---

## ⚙️ Working Principle

1. Caregiver sets:
   - Meal timings
   - Medicine schedule (Before/After food)

2. Data is stored in Firebase.

3. ESP32:
   - Fetches schedule from cloud
   - Uses RTC to track time

4. At reminder time:
   - LED glows
   - Buzzer sounds

5. Reed switch detects:
   - Box opened → ✅ Taken
   - Not opened → ❌ Missed

6. Status is sent back to the cloud.

---

## 🔌 Hardware Components

- ESP32
- DS3231 RTC Module
- Reed Switch + Magnet
- Buzzer
- LED
- Resistors
- Jumper Wires

---

## 🔧 Circuit Connections

| Component | ESP32 Pin |
|----------|----------|
| Reed Switch | GPIO 13 |
| Buzzer | GPIO 27 |
| LED | GPIO 26 |
| RTC SDA | GPIO 21 |
| RTC SCL | GPIO 22 |
| RTC VCC | 3.3V |
| RTC GND | GND |

---

## 🌐 Software & Technologies

- Arduino IDE (ESP32 Programming)
- Firebase Realtime Database
- Firestore (for logs)
- HTML/CSS/JS (Web Dashboard)
- Google AI Studio (UI generation)

---

## 📁 Project Structure
