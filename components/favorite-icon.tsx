export default function FavoriteIcon({ saved = false }: { saved?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12v16l-6-4-6 4z" />
    </svg>
  );
}
