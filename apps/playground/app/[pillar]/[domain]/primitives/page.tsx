import { PlaygroundProvider } from '../../../_providers/oculus-provider';
import { PrimitivesZooClient } from './PrimitivesZooClient';

export default function PrimitivesPage() {
  return (
    <PlaygroundProvider seedData={false}>
      <PrimitivesZooClient />
    </PlaygroundProvider>
  );
}
