import { PoseDetectionResult } from '../types';
import { IVisionProvider } from './VisionProvider';

declare global {
  interface Window {
    Pose?: any;
  }
}

export class MediaPipePoseProvider implements IVisionProvider {
  private poseModel: any = null;
  private ready = false;
  private lastResult: PoseDetectionResult = {
    landmarks: [],
    confidence: 0,
    detected: false,
    timestamp: Date.now()
  };

  public getName(): string {
    return 'MediaPipe BlazePose (Browser GPU / WebAssembly)';
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async initialize(): Promise<boolean> {
    try {
      // Check if MediaPipe script is already loaded
      if (!window.Pose) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js');
      }

      if (!window.Pose) {
        throw new Error('MediaPipe Pose library could not be loaded from CDN');
      }

      this.poseModel = new window.Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
        }
      });

      this.poseModel.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.poseModel.onResults((results: any) => {
        if (results && results.poseLandmarks && results.poseLandmarks.length >= 29) {
          this.lastResult = {
            landmarks: results.poseLandmarks.map((lm: any) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z ?? 0,
              visibility: lm.visibility ?? 1
            })),
            confidence: 0.92,
            detected: true,
            timestamp: Date.now()
          };
        } else {
          this.lastResult = {
            landmarks: [],
            confidence: 0,
            detected: false,
            timestamp: Date.now()
          };
        }
      });

      await this.poseModel.initialize();
      this.ready = true;
      return true;
    } catch (err) {
      console.warn('MediaPipe initialization warning (using browser fallback provider):', err);
      this.ready = false;
      return false;
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  public async estimatePose(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement
  ): Promise<PoseDetectionResult> {
    if (!this.ready || !this.poseModel) {
      return this.lastResult;
    }

    try {
      await this.poseModel.send({ image: videoOrCanvas });
      return this.lastResult;
    } catch (err) {
      return this.lastResult;
    }
  }

  public dispose(): void {
    if (this.poseModel && typeof this.poseModel.close === 'function') {
      try {
        this.poseModel.close();
      } catch (e) {
        // ignore
      }
    }
    this.poseModel = null;
    this.ready = false;
  }
}
