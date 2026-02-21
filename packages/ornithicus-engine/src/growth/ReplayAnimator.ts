/**
 * ReplayAnimator
 *
 * Animates commit-by-commit tree growth. Reads topology snapshots
 * from CHRONOS and interpolates between states to visualize
 * repository evolution over time.
 */

export interface ReplayState {
  commitIndex: number;
  totalCommits: number;
  playing: boolean;
  speed: number;
}

export class ReplayAnimator {
  private state: ReplayState = {
    commitIndex: 0,
    totalCommits: 0,
    playing: false,
    speed: 1,
  };

  getState(): ReplayState {
    return { ...this.state };
  }

  setTotalCommits(total: number): void {
    this.state.totalCommits = total;
  }

  play(): void {
    this.state.playing = true;
  }

  pause(): void {
    this.state.playing = false;
  }

  seekTo(index: number): void {
    this.state.commitIndex = Math.max(0, Math.min(index, this.state.totalCommits - 1));
  }
}
