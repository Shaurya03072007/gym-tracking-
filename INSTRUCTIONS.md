# FitVision AI — AI Gym Tracking & Personal Coach

FitVision AI is a production-grade interactive fitness and biomechanics platform that tracks exercise form in real time using edge computer vision, counts repetitions using an analytical state machine, scores movement quality (0–100), and provides natural-language AI coaching via Google Gemini.

---

## 1. System Architecture

FitVision AI employs a **Hybrid AI Architecture**:
1. **Local Vision Inference (Edge)**:
   - Evaluates video feed frame-by-frame (60 FPS) in the browser via **MediaPipe BlazePose** or the built-in **Synthetic Kinematics Engine**.
   - Raw video frames are **never** uploaded to an external server or sent to LLMs, ensuring privacy and sub-16ms latency.
2. **Deterministic Biomechanics Engine**:
   - Computes 3D joint angles using 3D Euclidean vector dot products:
     $$\theta = \arccos\left(\frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}\right)$$
   - Evaluates a transparent **0–100 Form Score**:
     - Joint Alignment (25 pts)
     - Range of Motion / Depth (25 pts)
     - Movement Control & Stability (20 pts)
     - Bilateral Symmetry (15 pts)
     - Tempo Adherence (15 pts)
3. **Repetition State Machine**:
   - Deterministic finite-state machine tracking: `PREPARING` → `START_POSITION` → `ECCENTRIC` → `PEAK_CONTRACTION` → `CONCENTRIC` → `COMPLETED_REP`.
   - Supports eccentric, pause, and concentric duration measurement.
   - Dedicated isometric mode for planks, wall sits, and static holds.
4. **Server-Side AI Reasoning (Gemini 3.8 Flash)**:
   - Ingests structured numerical telemetry events upon rep or set completion:
     `{ exercise, rep, knee_angle, hip_angle, torso_angle, depth, tempo, form_score, issues }`
   - Returns concise personal trainer voice cues synthesized via Web Speech API / Web Audio API.

---

## 2. Exercise Library & Form Guidelines

FitVision AI includes **31+ strength, hypertrophy, and bodyweight exercises** across 7 movement categories:
- **Squats & Variants**: Barbell Squat, Front Squat, Goblet Squat, Bulgarian Split Squat, Sumo Squat.
- **Chest & Push**: Standard Push-up, Barbell Bench Press, Incline Dumbbell Press, Diamond Push-up, Dips.
- **Back & Pull**: Conventional Deadlift, Romanian Deadlift (RDL), Barbell Bent-Over Row, Pull-ups, Chin-ups, Lat Pulldown.
- **Shoulders**: Overhead Shoulder Press, Arnold Press, Dumbbell Lateral Raises, Face Pulls.
- **Arms**: Barbell Bicep Curls, Hammer Curls, Tricep Rope Pushdown, Skull Crushers.
- **Legs**: Walking Lunges, Romanian Deadlift, Standing Calf Raises, Step-ups.
- **Core & Isometric**: Plank, Side Plank, Hanging Leg Raises, Ab Wheel Rollouts, Russian Twists.

Each exercise defines:
- Primary & secondary tracked joint angles
- Recommended camera view (Side 90°, Front 45°, Front 0°)
- Start angle and peak target angle
- Tolerance window and biomechanical violation triggers (e.g. knee valgus, lumbar rounding, elbow flare)

---

## 3. Sports Nutrition & 500+ Food Database

- **Mifflin-St Jeor BMR Formula**:
  - Men: $\text{BMR} = 10 \times \text{weight(kg)} + 6.25 \times \text{height(cm)} - 5 \times \text{age} + 5$
  - Women: $\text{BMR} = 10 \times \text{weight(kg)} + 6.25 \times \text{height(cm)} - 5 \times \text{age} - 161$
- **TDEE Multipliers**: Sedentary (1.20) to Extra Active (1.90)
- **Macro Distribution**:
  - Protein: 1.8g to 2.2g per kg bodyweight
  - Fat: ~25% of total caloric intake
  - Carbohydrates: Remainder of energy needs
- **500+ Indian & International Food Database**:
  - Authentic lentils and dals (Yellow Dal Tadka, Moong Dal, Rajma, Chana Masala, Sambar)
  - Rotis & grains (Whole Wheat Chapati, Bajra, Jowar, Ragi, Basmati, Brown Rice)
  - Dairy & plant proteins (Low-Fat Paneer, Malai Paneer, Dahi/Curd, Chaas, Soya Chunks, Tofu, Whey Isolate)
  - Poultry, seafood, and eggs (Chicken Breast, Chicken Tikka, Kingfish Curry, Atlantic Salmon, Whole Boiled Eggs, Egg Whites)
- **AI Food Swapper**: Seamlessly swap ingredients while automatically matching caloric and macronutrient targets.

---

## 4. Privacy & Client-Side Isolation

- All video frames from webcams are consumed locally by HTML5 `<video>` and `<canvas>` elements.
- No camera frames are transmitted across HTTP or WebSockets.
- Only anonymized vector angles and rep metrics are provided to LLM endpoints.

---

## 5. Running the Application

### Development
```bash
npm run dev
```
Launches the full-stack server on `http://0.0.0.0:3000` with tsx and Vite middleware.

### Production Build
```bash
npm run build
```
Generates client static files into `dist/` and bundles `server.ts` into a self-contained CommonJS artifact at `dist/server.cjs`.

### Production Launch
```bash
npm start
```
Runs `node dist/server.cjs` on port 3000.
