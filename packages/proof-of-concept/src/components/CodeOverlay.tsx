/**
 * OCULUS: Code Reader Overlay
 *
 * This demonstrates the "World as Wallpaper, UI as Workbench" philosophy.
 * The 3D world provides context; the 2D overlay provides content.
 */

import { useEffect, useState } from 'react';

interface CodeOverlayProps {
  filePath: string;
  onClose: () => void;
}

export function CodeOverlay({ filePath, onClose }: CodeOverlayProps) {
  const [content, setContent] = useState<string>('Loading...');

  useEffect(() => {
    // In the real version, this would load from OPERATUS
    fetch(`/${filePath}`)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch(() => setContent('// Failed to load file'));
  }, [filePath]);

  return (
    <div className="code-overlay">
      <div className="code-overlay-header">
        <h3>{filePath}</h3>
        <button onClick={onClose}>✕ Close</button>
      </div>
      <div className="code-overlay-content">
        <pre>
          <code>{content}</code>
        </pre>
      </div>
      <div className="code-overlay-footer">
        <p>💡 In the full version, this would be a Miller Column interface</p>
      </div>
    </div>
  );
}
