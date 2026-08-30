/* The mark is two interlocking links — each masked so it passes OVER the other
   at one crossing and UNDER it at the other. It was once drawn from memory as
   a word in two colours, which is not the mark. It is never assembled from
   characters or shapes arranged to look like the wordmark: that has been
   removed from this codebase three times. */
export function Mark({ size = 26 }: { size?: number }) {
  const h = size;
  const w = (size * 46) / 28;
  return (
    <svg width={w} height={h} viewBox="0 0 46 28" fill="none" aria-hidden="true" focusable="false">
      <defs>
        {/* link A gives way where link B crosses in front, at the lower join */}
        <mask id="sl-link-a" maskUnits="userSpaceOnUse" x="0" y="0" width="46" height="28">
          <rect x="0" y="0" width="46" height="28" fill="#fff" />
          <circle cx="23" cy="20" r="5.4" fill="#000" />
        </mask>
        {/* link B gives way at the upper join, so the two pass through one another */}
        <mask id="sl-link-b" maskUnits="userSpaceOnUse" x="0" y="0" width="46" height="28">
          <rect x="0" y="0" width="46" height="28" fill="#fff" />
          <circle cx="23" cy="8" r="5.4" fill="#000" />
        </mask>
      </defs>
      <rect
        x="2.6" y="2.6" width="27" height="22.8" rx="11.4"
        stroke="var(--sky)" strokeWidth="4.2" mask="url(#sl-link-a)"
      />
      <rect
        x="16.4" y="2.6" width="27" height="22.8" rx="11.4"
        stroke="var(--ink)" strokeWidth="4.2" mask="url(#sl-link-b)"
      />
    </svg>
  );
}
