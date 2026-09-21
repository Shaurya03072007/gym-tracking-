import { NormalizedLandmarks, PoseDetectionResult } from '../types';
import { IVisionProvider } from './VisionProvider';

/**
 * SystemStreamVisionProvider
 * Sends live mobile camera frames to the FitVision backend system.
 * The system computes biomechanical lines, landmarks, and telemetry and streams them back to the phone.
 * NO simulated data or mock sine-waves: exclusively operates on real video frames.
 */
export class SystemStreamVisionProvider implements IVisionProvider {
  private ready = false;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private isProcessing = false;
  private lastCallTime = 0;
  private exerciseId = 'squat';

  private lastResult: PoseDetectionResult = {
    landmarks: [],
    confidence: 0,
    detected: false,
    timestamp: Date.now()
  };

  public setExercise(exerciseId: string) {
    this.exerciseId = exerciseId;
  }

  public getName(): string {
    return 'FitVision AI System Stream (Cloud / Backend Vision Processing)';
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async initialize(): Promise<boolean> {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 480;
    this.offscreenCanvas.height = 360;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    this.ready = true;
    return true;
  }

  public async estimatePose(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement
  ): Promise<PoseDetectionResult> {
    if (!this.ready || !this.offscreenCtx || !this.offscreenCanvas) {
      return this.lastResult;
    }

    // Rate-limit network requests to system (e.g. ~10 FPS for network payload efficiency)
    const now = Date.now();
    if (this.isProcessing || now - this.lastCallTime < 100) {
      return this.lastResult;
    }

    try {
      this.isProcessing = true;
      this.lastCallTime = now;

      // Draw downscaled frame for rapid network transmission
      this.offscreenCtx.drawImage(
        videoOrCanvas,
        0,
        0,
        this.offscreenCanvas.width,
        this.offscreenCanvas.height
      );

      const frameBase64 = this.offscreenCanvas.toDataURL('image/jpeg', 0.6);

      const response = await fetch('/api/vision/process-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameBase64,
          exerciseId: this.exerciseId,
          timestamp: now
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.landmarks && Array.isArray(data.landmarks) && data.landmarks.length >= 29) {
          this.lastResult = {
            landmarks: data.landmarks,
            confidence: data.confidence || 0.9,
            detected: true,
            timestamp: now
          };
        } else if (data.athleteInFrame) {
          // If system verified athlete presence and angles, maintain/update detection status
          this.lastResult.detected = true;
          this.lastResult.timestamp = now;
        } else {
          this.lastResult.detected = false;
        }
      }
    } catch (err) {
      // Network or processing hiccup; keep previous valid result without throwing
    } finally {
      this.isProcessing = false;
    }

    return this.lastResult;
  }

  public dispose(): void {
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.ready = false;
  }
}
