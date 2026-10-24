/** The small round profile photo shown at the top of phone screens. */
export default function MiniAvatar({ url, className }: { url: string; className: string }) {
  return (
    <div className={className} aria-hidden="true">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        <svg viewBox="0 0 44 44">
          <circle cx="22" cy="17" r="8" fill="#bdb9b0" />
          <path d="M6 44c1-12 8-17 16-17s15 5 16 17z" fill="#bdb9b0" />
        </svg>
      )}
    </div>
  );
}
