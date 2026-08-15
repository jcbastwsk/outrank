import Image from "next/image";
import Link from "next/link";

export function Mark({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/mark.jpg"
      alt="Outrank"
      width={size}
      height={size}
      className="rounded-xl"
      priority
    />
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Mark size={34} />
      <span className="text-[15px] font-semibold tracking-tight">Outrank</span>
    </Link>
  );
}
