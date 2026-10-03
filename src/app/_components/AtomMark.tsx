export function AtomMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className="shrink-0" aria-hidden="true">
      <g transform="translate(20,20)">
        <ellipse rx="15" ry="5.5" fill="none" stroke="#E8740C" strokeWidth="1.3" opacity="0.8" />
        <ellipse rx="15" ry="5.5" fill="none" stroke="#E8740C" strokeWidth="1.3" transform="rotate(60)" opacity="0.8" />
        <ellipse rx="15" ry="5.5" fill="none" stroke="#E8740C" strokeWidth="1.3" transform="rotate(120)" opacity="0.8" />
        <circle r="3" fill="#E8740C" />
      </g>
    </svg>
  )
}
