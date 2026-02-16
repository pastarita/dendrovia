/**
 * Story Arc — public API
 */

export { deriveStoryArc } from './StoryArcDeriver.js';
export { sliceSegments, type RawSegment } from './SegmentSlicer.js';
export { mapMood } from './MoodMapper.js';
export { assignPhases, computeTension, type PhaseAssignment } from './PhaseAssigner.js';
