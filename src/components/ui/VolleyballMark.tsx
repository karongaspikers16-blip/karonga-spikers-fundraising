import Image from "next/image";

/** The club's volleyball, used as the marker that rides the fundraising progress bar and as a placeholder. */
export function VolleyballMark({ className = "size-8" }: { className?: string }) {
  return (
    <Image
      src="/images/volleyball.jpeg"
      alt=""
      aria-hidden
      width={96}
      height={96}
      className={`rounded-full object-cover ${className}`}
    />
  );
}
