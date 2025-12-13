import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border-none bg-white/50 backdrop-blur-md px-4 py-3 text-base ring-1 ring-black/5 transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-inner",
        "dark:bg-white/10 dark:ring-white/10 dark:focus-visible:ring-primary",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
