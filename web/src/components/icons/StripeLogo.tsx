export default function StripeLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#635BFF"/>
      <path d="M11.2 9.6c0-.7.6-1 1.5-1 1.3 0 3 .4 4.3 1.1V6.3C15.6 5.8 14.3 5.5 13 5.5c-3 0-5 1.6-5 4.2 0 4.1 5.6 3.5 5.6 5.2 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.9-1.4v3.5c1.7.7 3.3 1 4.9 1 3.1 0 5.2-1.5 5.2-4.2-.1-4.4-5.9-3.6-5.9-5.3z" fill="white"/>
    </svg>
  );
}
