export default function TremorLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" rx="6" stroke="#FF2D7B" strokeWidth="2" fill="none"/>
      <path d="M6 16H10L12 9L15 23L18 7L21 21L23 13H26" stroke="#FF2D7B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
