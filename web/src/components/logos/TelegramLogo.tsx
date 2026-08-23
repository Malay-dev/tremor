export default function TelegramLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#2AABEE"/>
      <path d="M5.43 11.87l11.9-4.9c.55-.2 1.03.13.85.96l-2.03 9.55c-.15.68-.55.84-1.12.52l-3.1-2.28-1.49 1.44c-.17.17-.31.31-.63.31l.22-3.15 5.7-5.15c.25-.22-.05-.34-.39-.13L8.3 13.54l-3.03-.95c-.66-.2-.67-.66.14-.98z" fill="white"/>
    </svg>
  );
}
