/**
 * Story Arc — public API
 */

export { deriveStoryArc } from './StoryArcDeriver';
export { sliceSegments, type RawSegment } from './SegmentSlicer';
export { mapMood } from './MoodMapper';
export { assignPhases, computeTension, type PhaseAssignment } from './PhaseAssigner';
