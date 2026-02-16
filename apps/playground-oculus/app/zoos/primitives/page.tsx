import { PlaygroundProvider } from '../../components/PlaygroundProvider';
import { PrimitivesZooClient } from './PrimitivesZooClient';

export default function PrimitivesPage() {
  return (
    <PlaygroundProvider seedData={false}>
      <PrimitivesZooClient />
    </PlaygroundProvider>
  );
}
