/**
 * Story Arc — public API
 */

export { mapMood } from './MoodMapper.js';
export { assignPhases, computeTension, type PhaseAssignment } from './PhaseAssigner.js';
export { type RawSegment, sliceSegments } from './SegmentSlicer.js';
export { deriveStoryArc } from './StoryArcDeriver.js';
