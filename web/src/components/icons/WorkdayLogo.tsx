export default function WorkdayLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#F68D2E"/>
      <circle cx="12" cy="9" r="3" fill="white"/>
      <path d="M7 17.5C7 14.5 9.2 12.5 12 12.5C14.8 12.5 17 14.5 17 17.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
