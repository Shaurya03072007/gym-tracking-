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

      // Mobile devices run best on modelComplexity 0 for 60 FPS thermal efficiency
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      this.poseModel.setOptions({
        modelComplexity: isMobile ? 0 : 1,
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
            confidence: 0.94,
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

      // Initialize with a 6-second timeout race to prevent hanging on slow network / firewalls
      const initPromise = this.poseModel.initialize();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('MediaPipe initialization timed out')), 6000)
      );

      await Promise.race([initPromise, timeoutPromise]);
      this.ready = true;
      return true;
    } catch (err) {
      console.warn('MediaPipe initialization notice (falling back to Kinematic Vision Engine):', err);
      this.ready = false;
      return false;
    }
  }

  private async loadScript(src: string): Promise<void> {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && window.Pose) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      const timer = setTimeout(() => {
        reject(new Error(`Loading script ${src} timed out`));
      }, 5000);

      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = (e) => {
        clearTimeout(timer);
        reject(e);
      };
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
