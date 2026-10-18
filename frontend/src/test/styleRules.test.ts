import { describe, expect, it } from 'vitest';

const sourceFiles = import.meta.glob('../**/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const stylesheetFiles = import.meta.glob('../index.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const stylesheetSource = Object.values(stylesheetFiles).join('\n');

const bannedPatterns = [
  /(?<![\w-])(?:ml|mr|pl|pr)-/,
  /(?<![\w-])(?:left|right|start|end)-/,
  /(?<![\w-])text-(?:left|right)(?![\w-])/,
  /(?<![\w-])space-x-/,
  /(?<![\w-])divide-x-/,
  /(?<![\w-])rounded-(?:l|r|tl|tr|bl|br)(?:-|\b)/,
  /(?<![\w-])border-(?:l|r)(?![a-z])/,
  /(?<![\w-])float-(?:left|right)(?![\w-])/,
  /(?<![\w-])[a-z-]+-\[/,
  /(?<![\w-])[a-z-]+-\(--/,
  /dangerouslySetInnerHTML/,
  /\b(?:bg|text|border|ring|divide)-(?:slate|teal|red|gray|white|black)(?:-\d+)?\b/,
];

describe('Tailwind logical-property rules', () => {
  it('shows visual action tooltips only on desktop hover/focus devices', () => {
    expect(stylesheetSource).toContain('@media (min-width: 64rem) and (hover: hover) and (pointer: fine)');
    expect(stylesheetSource).toContain('.action-tooltip-trigger:hover .action-tooltip');
    expect(stylesheetSource).toContain('.action-tooltip-trigger:focus-visible .action-tooltip');
    expect(stylesheetSource).toContain('.search-clear-button.action-tooltip-trigger');
    expect(stylesheetSource).toMatch(/\.search-clear-button \.action-tooltip\s*\{[^}]*inset-inline-start:\s*auto;[^}]*inset-inline-end:\s*0;[^}]*transform:\s*none;[^}]*\}/);
    expect(stylesheetSource).toContain('visibility: hidden');
    expect(stylesheetSource).toContain(':dir(rtl) .action-tooltip');
    expect(stylesheetSource).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('contains no banned directional, arbitrary, raw-palette, or unsafe HTML patterns', () => {
    const violations = Object.entries(sourceFiles)
      .filter(([file]) => !file.endsWith('.test.tsx'))
      .flatMap(([file, source]) => (
        bannedPatterns.flatMap((pattern) => {
          const matches = source.match(pattern);
          return matches ? [`${file}: ${matches[0]}`] : [];
        })
      ));

    expect(violations).toEqual([]);
  });
});
