export default function BrightDataLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="bd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35"/>
          <stop offset="100%" stopColor="#E63946"/>
        </linearGradient>
      </defs>
      <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="url(#bd)"/>
      <path d="M12 7L17 12L12 17L7 12L12 7Z" fill="white" fillOpacity="0.25"/>
    </svg>
  );
}
