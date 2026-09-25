import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { NormalizedLandmarks, PoseDetectionResult } from '../types';
import { IVisionProvider } from './VisionProvider';

export class MoveNetPoseProvider implements IVisionProvider {
  private detector: poseDetection.PoseDetector | null = null;
  private ready = false;
  private lastResult: PoseDetectionResult = {
    landmarks: [],
    confidence: 0,
    detected: false,
    timestamp: Date.now()
  };

  public getName(): string {
    return 'TensorFlow.js MoveNet (Thunder)';
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async initialize(): Promise<boolean> {
    try {
      const model = poseDetection.SupportedModels.MoveNet;
      this.detector = await poseDetection.createDetector(model, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        enableSmoothing: true
      });
      this.ready = true;
      return true;
    } catch (err) {
      console.error('MoveNet initialization failed:', err);
      this.ready = false;
      return false;
    }
  }

  public async estimatePose(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement
  ): Promise<PoseDetectionResult> {
    if (!this.ready || !this.detector) {
      return this.lastResult;
    }

    try {
      const poses = await this.detector.estimatePoses(videoOrCanvas, {
        maxPoses: 1,
        flipHorizontal: false
      });

      if (poses.length > 0 && poses[0].keypoints) {
        const pose = poses[0];
        
        let width = 1;
        let height = 1;

        if (videoOrCanvas instanceof HTMLVideoElement) {
          width = videoOrCanvas.videoWidth || videoOrCanvas.width || 1;
          height = videoOrCanvas.videoHeight || videoOrCanvas.height || 1;
        } else if (videoOrCanvas instanceof HTMLCanvasElement) {
          width = videoOrCanvas.width || 1;
          height = videoOrCanvas.height || 1;
        }

        const kps = pose.keypoints;
        const lm: NormalizedLandmarks = new Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 });

        // Map MoveNet (17) to BlazePose (33)
        // MoveNet layout:
        // 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear
        // 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow
        // 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip
        // 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle

        const mapPoint = (moveNetIdx: number, blazePoseIdx: number) => {
          const p = kps[moveNetIdx];
          if (p) {
            lm[blazePoseIdx] = {
              x: p.x / width,
              y: p.y / height,
              z: 0,
              visibility: p.score ?? 0
            };
          }
        };

        mapPoint(0, 0);   // nose
        mapPoint(1, 2);   // left_eye
        mapPoint(2, 5);   // right_eye
        mapPoint(3, 7);   // left_ear
        mapPoint(4, 8);   // right_ear
        mapPoint(5, 11);  // left_shoulder
        mapPoint(6, 12);  // right_shoulder
        mapPoint(7, 13);  // left_elbow
        mapPoint(8, 14);  // right_elbow
        mapPoint(9, 15);  // left_wrist
        mapPoint(10, 16); // right_wrist
        mapPoint(11, 23); // left_hip
        mapPoint(12, 24); // right_hip
        mapPoint(13, 25); // left_knee
        mapPoint(14, 26); // right_knee
        mapPoint(15, 27); // left_ankle
        mapPoint(16, 28); // right_ankle

        // Overall pose confidence
        const confidence = pose.score ?? 0;

        this.lastResult = {
          landmarks: lm,
          confidence,
          detected: confidence > 0.25,
          timestamp: Date.now()
        };
      } else {
        this.lastResult.detected = false;
        this.lastResult.confidence = 0;
      }

      return this.lastResult;
    } catch (err) {
      return this.lastResult;
    }
  }

  public dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
    this.ready = false;
  }
}
