import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted"><WifiOff size={26} /></span>
      <h1 className="mt-4 text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-muted">CorpGurus needs a connection to load requirements, messages and profiles. This page will work again as soon as you are back online.</p>
    </div>
  );
}
