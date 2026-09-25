// Shim for @mediapipe/pose to satisfy static imports in @tensorflow-models/pose-detection when bundling with Vite/Rolldown.
export class Pose {
  constructor(config?: any) {
    if (typeof window !== 'undefined' && (window as any).Pose) {
      return new (window as any).Pose(config);
    }
  }
}

export default { Pose };
