import { DropletIcon } from "lucide-react";

import { cn } from "~/lib/cn";

export function Logo(props: { className?: string }) {
  const { className } = props;
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center justify-center gap-1 font-extrabold text-slate-900",
        className,
      )}
    >
      <DropletIcon className="text-primary size-4" strokeWidth={3} />
      Liqua
    </div>
  );
}
