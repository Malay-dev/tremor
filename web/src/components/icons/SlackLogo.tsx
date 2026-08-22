export default function SlackLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.04 15.24a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52zm1.26 0a2.52 2.52 0 1 1 5.04 0v6.3a2.52 2.52 0 1 1-5.04 0v-6.3z" fill="#E01E5A"/>
      <path d="M8.82 5.04a2.52 2.52 0 1 1 2.52-2.52v2.52H8.82zm0 1.26a2.52 2.52 0 1 1 0 5.04H2.52a2.52 2.52 0 0 1 0-5.04h6.3z" fill="#36C5F0"/>
      <path d="M18.96 8.82a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.82zm-1.26 0a2.52 2.52 0 1 1-5.04 0V2.52a2.52 2.52 0 0 1 5.04 0v6.3z" fill="#2EB67D"/>
      <path d="M15.18 18.96a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52zm0-1.26a2.52 2.52 0 1 1 0-5.04h6.3a2.52 2.52 0 0 1 0 5.04h-6.3z" fill="#ECB22E"/>
    </svg>
  );
}
