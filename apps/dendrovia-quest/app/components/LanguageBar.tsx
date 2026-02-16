'use client';

/**
 * LanguageBar — Horizontal 4px bar with colored segments proportional
 * to language distribution. Uses standard GitHub language colors.
 */

const GITHUB_LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Go: '#00add8',
  Rust: '#dea584',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Markdown: '#083fa1',
  Json: '#292929',
  Yaml: '#cb171e',
  Toml: '#9c4221',
  Unknown: '#555555',
};

interface LanguageBarProps {
  languages: Array<{ language: string; fileCount: number; percentage: number }>;
}

export function LanguageBar({ languages }: LanguageBarProps) {
  if (!languages.length) return null;

  return (
    <div
      style={{
        display: 'flex',
        height: '4px',
        borderRadius: '2px',
        overflow: 'hidden',
        width: '100%',
      }}
      title={languages.map(l => `${l.language} ${l.percentage}%`).join(', ')}
    >
      {languages.map((lang) => (
        <div
          key={lang.language}
          style={{
            width: `${lang.percentage}%`,
            minWidth: lang.percentage > 0.5 ? '2px' : '0',
            background: GITHUB_LANG_COLORS[lang.language] ?? '#555',
          }}
        />
      ))}
    </div>
  );
}
