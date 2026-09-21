import { NormalizedLandmarks, PoseDetectionResult } from '../types';
import { IVisionProvider } from './VisionProvider';

export class SimulatedPoseProvider implements IVisionProvider {
  private ready = false;
  private startTime = Date.now();
  private exerciseType: 'squat' | 'pushup' | 'curl' | 'press' | 'plank' = 'squat';

  public getName(): string {
    return 'Synthetic Biomechanical Kinematics Engine';
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async initialize(): Promise<boolean> {
    this.ready = true;
    this.startTime = Date.now();
    return true;
  }

  public setExerciseType(type: 'squat' | 'pushup' | 'curl' | 'press' | 'plank') {
    this.exerciseType = type;
  }

  public async estimatePose(
    _videoOrCanvas: HTMLVideoElement | HTMLCanvasElement
  ): Promise<PoseDetectionResult> {
    const elapsed = (Date.now() - this.startTime) / 1000;
    // 3.5s per rep cycle
    const cycle = (Math.sin((elapsed * Math.PI * 2) / 3.5) + 1) / 2; // 0 (start) to 1 (peak)

    let landmarks: NormalizedLandmarks = [];

    switch (this.exerciseType) {
      case 'pushup':
      case 'plank':
        landmarks = this.generatePlankPushupPose(cycle, this.exerciseType === 'plank');
        break;
      case 'curl':
        landmarks = this.generateCurlPose(cycle);
        break;
      case 'press':
        landmarks = this.generatePressPose(cycle);
        break;
      case 'squat':
      default:
        landmarks = this.generateSquatPose(cycle);
        break;
    }

    return {
      landmarks,
      confidence: 0.98,
      detected: true,
      timestamp: Date.now()
    };
  }

  private generateSquatPose(t: number): NormalizedLandmarks {
    // Standing: hips at y=0.55, knees at y=0.72, ankles at y=0.90
    // Squatting (t=1): hips drop to y=0.73, knees bend forward to y=0.73
    const hipY = 0.52 + t * 0.20;
    const kneeY = 0.72 + t * 0.03;
    const ankleY = 0.90;

    const shoulderY = 0.30 + t * 0.17;
    const headY = 0.18 + t * 0.16;

    // Slight forward torso hinge
    const torsoDriftX = t * 0.03;

    return this.buildStandard33Landmarks({
      head: { x: 0.50 + torsoDriftX, y: headY },
      lShoulder: { x: 0.44 + torsoDriftX, y: shoulderY },
      rShoulder: { x: 0.56 + torsoDriftX, y: shoulderY },
      lElbow: { x: 0.42, y: shoulderY + 0.12 },
      rElbow: { x: 0.58, y: shoulderY + 0.12 },
      lWrist: { x: 0.45, y: shoulderY + 0.18 },
      rWrist: { x: 0.55, y: shoulderY + 0.18 },
      lHip: { x: 0.45 + torsoDriftX * 0.5, y: hipY },
      rHip: { x: 0.55 + torsoDriftX * 0.5, y: hipY },
      lKnee: { x: 0.44 - t * 0.02, y: kneeY }, // Knees tracking properly
      rKnee: { x: 0.56 + t * 0.02, y: kneeY },
      lAnkle: { x: 0.43, y: ankleY },
      rAnkle: { x: 0.57, y: ankleY }
    });
  }

  private generateCurlPose(t: number): NormalizedLandmarks {
    // Elbows stay pinned at y=0.48, wrists curl from y=0.68 up to y=0.35
    const wristY = 0.68 - t * 0.33;
    const wristXOffset = t * 0.03;

    return this.buildStandard33Landmarks({
      head: { x: 0.50, y: 0.18 },
      lShoulder: { x: 0.43, y: 0.30 },
      rShoulder: { x: 0.57, y: 0.30 },
      lElbow: { x: 0.41, y: 0.48 },
      rElbow: { x: 0.59, y: 0.48 },
      lWrist: { x: 0.41 + wristXOffset, y: wristY },
      rWrist: { x: 0.59 - wristXOffset, y: wristY },
      lHip: { x: 0.45, y: 0.55 },
      rHip: { x: 0.55, y: 0.55 },
      lKnee: { x: 0.45, y: 0.74 },
      rKnee: { x: 0.55, y: 0.74 },
      lAnkle: { x: 0.45, y: 0.92 },
      rAnkle: { x: 0.55, y: 0.92 }
    });
  }

  private generatePressPose(t: number): NormalizedLandmarks {
    // Shoulder press: elbows from 90° up to 180° lockout
    const wristY = 0.32 - t * 0.18;
    const elbowY = 0.38 - t * 0.12;

    return this.buildStandard33Landmarks({
      head: { x: 0.50, y: 0.20 },
      lShoulder: { x: 0.43, y: 0.32 },
      rShoulder: { x: 0.57, y: 0.32 },
      lElbow: { x: 0.38 - t * 0.02, y: elbowY },
      rElbow: { x: 0.62 + t * 0.02, y: elbowY },
      lWrist: { x: 0.40 - t * 0.01, y: wristY },
      rWrist: { x: 0.60 + t * 0.01, y: wristY },
      lHip: { x: 0.45, y: 0.56 },
      rHip: { x: 0.55, y: 0.56 },
      lKnee: { x: 0.45, y: 0.75 },
      rKnee: { x: 0.55, y: 0.75 },
      lAnkle: { x: 0.45, y: 0.92 },
      rAnkle: { x: 0.55, y: 0.92 }
    });
  }

  private generatePlankPushupPose(t: number, isStaticPlank: boolean): NormalizedLandmarks {
    // Horizontal alignment
    const pushupDrop = isStaticPlank ? 0 : t * 0.14;

    return this.buildStandard33Landmarks({
      head: { x: 0.28, y: 0.54 + pushupDrop },
      lShoulder: { x: 0.36, y: 0.56 + pushupDrop },
      rShoulder: { x: 0.36, y: 0.54 + pushupDrop },
      lElbow: { x: 0.36, y: 0.66 + pushupDrop * 0.5 },
      rElbow: { x: 0.36, y: 0.64 + pushupDrop * 0.5 },
      lWrist: { x: 0.36, y: 0.75 },
      rWrist: { x: 0.36, y: 0.75 },
      lHip: { x: 0.56, y: 0.58 + pushupDrop },
      rHip: { x: 0.56, y: 0.56 + pushupDrop },
      lKnee: { x: 0.72, y: 0.60 + pushupDrop * 0.6 },
      rKnee: { x: 0.72, y: 0.58 + pushupDrop * 0.6 },
      lAnkle: { x: 0.86, y: 0.62 },
      rAnkle: { x: 0.86, y: 0.60 }
    });
  }

  private buildStandard33Landmarks(pts: {
    head: { x: number; y: number };
    lShoulder: { x: number; y: number };
    rShoulder: { x: number; y: number };
    lElbow: { x: number; y: number };
    rElbow: { x: number; y: number };
    lWrist: { x: number; y: number };
    rWrist: { x: number; y: number };
    lHip: { x: number; y: number };
    rHip: { x: number; y: number };
    lKnee: { x: number; y: number };
    rKnee: { x: number; y: number };
    lAnkle: { x: number; y: number };
    rAnkle: { x: number; y: number };
  }): NormalizedLandmarks {
    const list: NormalizedLandmarks = [];
    for (let i = 0; i < 33; i++) {
      list.push({ x: 0.5, y: 0.5, visibility: 0.95 });
    }

    list[0] = { ...pts.head, visibility: 0.99 }; // nose
    list[11] = { ...pts.lShoulder, visibility: 0.98 };
    list[12] = { ...pts.rShoulder, visibility: 0.98 };
    list[13] = { ...pts.lElbow, visibility: 0.98 };
    list[14] = { ...pts.rElbow, visibility: 0.98 };
    list[15] = { ...pts.lWrist, visibility: 0.97 };
    list[16] = { ...pts.rWrist, visibility: 0.97 };
    list[23] = { ...pts.lHip, visibility: 0.98 };
    list[24] = { ...pts.rHip, visibility: 0.98 };
    list[25] = { ...pts.lKnee, visibility: 0.98 };
    list[26] = { ...pts.rKnee, visibility: 0.98 };
    list[27] = { ...pts.lAnkle, visibility: 0.97 };
    list[28] = { ...pts.rAnkle, visibility: 0.97 };

    return list;
  }

  public dispose(): void {
    this.ready = false;
  }
}
