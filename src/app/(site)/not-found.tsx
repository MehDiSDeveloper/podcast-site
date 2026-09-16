import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center md:py-32">
      <p className="nums text-7xl font-extrabold text-brand-soft md:text-9xl" aria-hidden="true">
        ۴۰۴
      </p>
      <h1 className="mt-6 text-3xl md:text-4xl">این صفحه پیدا نشد</h1>
      <p className="mt-4 max-w-md leading-loose text-ink-muted">
        شاید آدرس اشتباه تایپ شده یا صفحه جابه‌جا شده است. از اینجا می‌توانید دوباره شروع کنید.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonStyles({ size: "lg" })}>
          بازگشت به خانه
        </Link>
        <Link href="/episodes" className={buttonStyles({ variant: "outline", size: "lg" })}>
          مرور اپیزودها
        </Link>
      </div>
    </div>
  );
}
