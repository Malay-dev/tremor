export default function TremorLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Seismograph-inspired mark: a pulse wave inside a rounded square */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#7C5CFC" fillOpacity="0.12" stroke="#7C5CFC" strokeWidth="1.5"/>
      <path
        d="M6 16H10L12 10L15 22L18 8L21 20L23 14H26"
        stroke="#7C5CFC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
