import Image from "next/image";
import Link from "next/link";

export function Mark({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/mark2.jpg"
      alt="Outrank"
      width={size}
      height={size}
      className="shrink-0"
      style={{ imageRendering: "auto" }}
      priority
    />
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Mark size={36} />
      <span className="pixel text-[17px] leading-none tracking-wide">
        <span className="text-[var(--hot)]">★</span> Outrank{" "}
        <span className="text-[var(--cyan)]">★</span>
      </span>
    </Link>
  );
}
