import { FormQuality, JointAngles, NormalizedLandmarks } from '../types';

// Standard skeleton bone connections (index pairs)
const SKELETON_CONNECTIONS: [number, number][] = [
  // Upper body
  [11, 12], // shoulders
  [11, 13], // left shoulder to elbow
  [13, 15], // left elbow to wrist
  [12, 14], // right shoulder to elbow
  [14, 16], // right elbow to wrist

  // Torso
  [11, 23], // left shoulder to hip
  [12, 24], // right shoulder to hip
  [23, 24], // hips

  // Lower body
  [23, 25], // left hip to knee
  [25, 27], // left knee to ankle
  [24, 26], // right hip to knee
  [26, 28], // right knee to ankle
  
  // Feet
  [27, 31],
  [28, 32]
];

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public clear(width: number, height: number) {
    this.ctx.clearRect(0, 0, width, height);
  }

  public render(
    landmarks: NormalizedLandmarks,
    width: number,
    height: number,
    quality: FormQuality,
    angles: JointAngles,
    primaryJointName: string,
    isMirrored: boolean = false
  ) {
    if (!landmarks || landmarks.length < 29) return;

    this.ctx.save();
    if (isMirrored) {
      this.ctx.translate(width, 0);
      this.ctx.scale(-1, 1);
    }

    // Determine biometric theme color based on form quality
    let boneColor = '#10b981'; // emerald-500
    let glowColor = 'rgba(16, 185, 129, 0.45)';
    let nodeColor = '#34d399';

    if (quality === 'WARNING') {
      boneColor = '#f59e0b'; // amber-500
      glowColor = 'rgba(245, 158, 11, 0.45)';
      nodeColor = '#fbbf24';
    } else if (quality === 'POOR FORM') {
      boneColor = '#ef4444'; // red-500
      glowColor = 'rgba(239, 68, 68, 0.45)';
      nodeColor = '#f87171';
    }

    // 1. Draw Bones
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 12;

    for (const [p1, p2] of SKELETON_CONNECTIONS) {
      const lm1 = landmarks[p1];
      const lm2 = landmarks[p2];

      if (!lm1 || !lm2) continue;
      if ((lm1.visibility ?? 1) < 0.35 || (lm2.visibility ?? 1) < 0.35) continue;

      const x1 = lm1.x * width;
      const y1 = lm1.y * height;
      const x2 = lm2.x * width;
      const y2 = lm2.y * height;

      this.ctx.beginPath();
      this.ctx.strokeStyle = boneColor;
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    // 2. Draw Landmark Joints
    this.ctx.shadowBlur = 8;
    for (let i = 11; i <= 28; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility ?? 1) < 0.35) continue;

      const x = lm.x * width;
      const y = lm.y * height;

      // Outer circle
      this.ctx.beginPath();
      this.ctx.fillStyle = nodeColor;
      this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
      this.ctx.fill();

      // Inner white core
      this.ctx.beginPath();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      this.ctx.fill();
    }

    // Head / Face
    if (landmarks[0] && (landmarks[0].visibility ?? 1) >= 0.4) {
      const hx = landmarks[0].x * width;
      const hy = landmarks[0].y * height;
      this.ctx.beginPath();
      this.ctx.strokeStyle = nodeColor;
      this.ctx.lineWidth = 2;
      this.ctx.arc(hx, hy, 16, 0, 2 * Math.PI);
      this.ctx.stroke();
    }

    // 3. Draw Joint Angle Callout Badges
    this.drawAngleBadge(landmarks[25], `${angles.leftKnee}°`, width, height, isMirrored, boneColor);
    this.drawAngleBadge(landmarks[26], `${angles.rightKnee}°`, width, height, isMirrored, boneColor);

    if (primaryJointName.includes('Elbow')) {
      this.drawAngleBadge(landmarks[13], `${angles.leftElbow}°`, width, height, isMirrored, boneColor);
      this.drawAngleBadge(landmarks[14], `${angles.rightElbow}°`, width, height, isMirrored, boneColor);
    }

    if (primaryJointName.includes('Hip')) {
      this.drawAngleBadge(landmarks[23], `${angles.leftHip}°`, width, height, isMirrored, boneColor);
      this.drawAngleBadge(landmarks[24], `${angles.rightHip}°`, width, height, isMirrored, boneColor);
    }

    this.ctx.restore();
  }

  private drawAngleBadge(
    landmark: any,
    text: string,
    width: number,
    height: number,
    isMirrored: boolean,
    color: string
  ) {
    if (!landmark || (landmark.visibility ?? 1) < 0.4) return;

    const x = landmark.x * width + 14;
    const y = landmark.y * height - 8;

    this.ctx.save();
    this.ctx.shadowBlur = 0;
    
    // Draw badge pill
    this.ctx.fillStyle = 'rgba(10, 10, 10, 0.82)';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;

    const textWidth = 38;
    const textHeight = 18;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y - textHeight + 4, textWidth, textHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    // Text (compensate for mirror if mirrored)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 11px JetBrains Mono, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (isMirrored) {
      // Invert local text transform so degrees read normally
      this.ctx.save();
      this.ctx.translate(x + textWidth / 2, y - 5);
      this.ctx.scale(-1, 1);
      this.ctx.fillText(text, 0, 0);
      this.ctx.restore();
    } else {
      this.ctx.fillText(text, x + textWidth / 2, y - 5);
    }

    this.ctx.restore();
  }
}
