"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-cream p-5 paper-grid"><section className="panel max-w-lg border-2 border-ink p-8 text-center"><span className="text-5xl" aria-hidden="true">⚠</span><h1 className="display mt-4 text-4xl font-black">This world hit a snag.</h1><p className="mt-3 text-ink/60">Your locally saved skills and progress are still safe. Retry this screen or return to the curriculum.</p><div className="mt-6 flex justify-center gap-3"><button onClick={reset} className="btn btn-lime">Try again</button><Link href="/" className="btn border border-ink/20 bg-white">Curriculum</Link></div></section></main>;
}
