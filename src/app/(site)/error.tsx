"use client";

import { useEffect } from "react";

import { Button, buttonStyles } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-24 text-center md:py-32">
      <h1 className="text-3xl md:text-4xl">مشکلی پیش آمد</h1>
      <p className="mt-4 max-w-md leading-loose text-ink-muted">
        بارگذاری این صفحه با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید؛ اگر مشکل ادامه داشت، کمی بعد سر بزنید.
      </p>
      {error.digest ? <p className="nums mt-3 text-xs text-ink-subtle">کد خطا: {error.digest}</p> : null}
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          تلاش دوباره
        </Button>
        {/* A plain anchor forces a full reload, which recovers from a broken client state. */}
        <a href="/" className={buttonStyles({ variant: "outline", size: "lg" })}>
          بازگشت به خانه
        </a>
      </div>
    </div>
  );
}
