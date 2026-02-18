import { PlaygroundProvider } from '../../../_providers/oculus-provider';
import { FrameZooClient } from './FrameZooClient';

export default function FramesZooPage() {
  return (
    <PlaygroundProvider seedData={false}>
      <FrameZooClient />
    </PlaygroundProvider>
  );
}
