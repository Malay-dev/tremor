export default function BrightDataLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bright Data's signature orange/red gradient diamond shape */}
      <defs>
        <linearGradient id="bd-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35"/>
          <stop offset="100%" stopColor="#E63946"/>
        </linearGradient>
      </defs>
      <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="url(#bd-grad)"/>
      <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="white" fillOpacity="0.3"/>
    </svg>
  );
}
