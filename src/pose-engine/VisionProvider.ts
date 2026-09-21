import { PoseDetectionResult } from '../types';

export interface IVisionProvider {
  /**
   * Initializes model weights, wasm binaries, or pipeline
   */
  initialize(): Promise<boolean>;

  /**
   * Performs frame-by-frame pose estimation
   */
  estimatePose(videoOrCanvas: HTMLVideoElement | HTMLCanvasElement): Promise<PoseDetectionResult>;

  /**
   * Cleans up resources
   */
  dispose(): void;

  /**
   * Display name of the provider
   */
  getName(): string;

  /**
   * Returns whether provider is ready
   */
  isReady(): boolean;
}
