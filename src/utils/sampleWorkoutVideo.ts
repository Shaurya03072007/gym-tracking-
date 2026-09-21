/**
 * sampleWorkoutVideo.ts
 * Generates an animated athletic biomechanical workout stream for testing
 * when physical camera hardware is absent (e.g. desktop PC without webcam, or VM).
 * Outputs a real MediaStream (via canvas.captureStream) or video element so that
 * the entire pose-engine, skeletal rendering, state machine, and rep counter work seamlessly.
 */

export interface SampleWorkoutHandle {
  stream: MediaStream;
  stop: () => void;
}

export function createSampleWorkoutStream(exerciseType: 'squat' | 'pushup' | 'curl' = 'squat'): SampleWorkoutHandle {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  let animationFrameId: number;
  let startTime = Date.now();
  let isRunning = true;

  // Athletic gym background & athlete proportions
  const renderFrame = () => {
    if (!isRunning) return;

    const elapsed = (Date.now() - startTime) / 1000;
    const repPeriod = 3.5; // 3.5 seconds per repetition (controlled tempo)
    const phase = (elapsed % repPeriod) / repPeriod; // 0 to 1

    // Motion cycle: 0 -> 0.5 (eccentric down), 0.5 -> 1.0 (concentric up)
    // Using smooth cosine curve
    const motionProgress = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI); // 0 at top, 1 at bottom

    const w = canvas.width;
    const h = canvas.height;

    // 1. Gym Environment Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.65, '#1e293b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Gym floor lines / depth perspective
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = h * 0.72 + i * 22;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Gym ambient lights
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.15, 120, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Realistic Human Athlete Silhouette
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const centerX = w * 0.5;

    // Squat Biomechanics
    // Top position: standing tall
    // Bottom position: hips descend, knees bend forward/outward, torso inclines slightly
    const hipDrop = motionProgress * 75; // 75px drop at bottom of squat
    const kneeBendX = motionProgress * 28; // knees push forward

    const headY = 95 + hipDrop * 0.85;
    const neckY = headY + 28;
    const shoulderY = neckY + 15;
    const hipY = 240 + hipDrop;
    const kneeY = 325 + hipDrop * 0.45;
    const ankleY = 410;

    // Head
    ctx.beginPath();
    ctx.arc(centerX, headY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Torso (neck to hips)
    ctx.lineWidth = 26;
    ctx.strokeStyle = '#38bdf8'; // athletic cyan jersey
    ctx.beginPath();
    ctx.moveTo(centerX, shoulderY);
    ctx.lineTo(centerX, hipY);
    ctx.stroke();

    // Arms (guarding or hands together in front of chest)
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#cbd5e1';
    // Left arm
    ctx.beginPath();
    ctx.moveTo(centerX - 24, shoulderY + 5);
    ctx.lineTo(centerX - 35, shoulderY + 45);
    ctx.lineTo(centerX, shoulderY + 55);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(centerX + 24, shoulderY + 5);
    ctx.lineTo(centerX + 35, shoulderY + 45);
    ctx.lineTo(centerX, shoulderY + 55);
    ctx.stroke();

    // Legs (Thighs & Shins) - Athletic dark shorts & calves
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#1e293b'; // workout shorts/leggings

    // Left leg
    ctx.beginPath();
    ctx.moveTo(centerX - 20, hipY);
    ctx.lineTo(centerX - 35 - kneeBendX * 0.5, kneeY);
    ctx.lineTo(centerX - 28, ankleY);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(centerX + 20, hipY);
    ctx.lineTo(centerX + 35 + kneeBendX * 0.5, kneeY);
    ctx.lineTo(centerX + 28, ankleY);
    ctx.stroke();

    // Shoes
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#10b981'; // emerald lifting shoes
    ctx.beginPath();
    ctx.moveTo(centerX - 38, ankleY);
    ctx.lineTo(centerX - 18, ankleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + 18, ankleY);
    ctx.lineTo(centerX + 38, ankleY);
    ctx.stroke();

    ctx.restore();

    // On-screen watermark indicating Sample Gym Workout Stream
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(16, 16, 210, 32);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('● SAMPLE WORKOUT STREAM', 28, 36);

    animationFrameId = requestAnimationFrame(renderFrame);
  };

  renderFrame();

  const stream = canvas.captureStream(30);

  return {
    stream,
    stop: () => {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      stream.getTracks().forEach(t => t.stop());
    }
  };
}
