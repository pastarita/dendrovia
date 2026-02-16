import { PlaygroundProvider } from '../../components/PlaygroundProvider';
import { FrameZooClient } from './FrameZooClient';

export default function FramesZooPage() {
  return (
    <PlaygroundProvider seedData={false}>
      <FrameZooClient />
    </PlaygroundProvider>
  );
}
