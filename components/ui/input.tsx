import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-lg border-none bg-white/50 backdrop-blur-md px-4 py-2 text-base ring-1 ring-black/5 transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-inner",
        "dark:bg-white/10 dark:ring-white/10 dark:focus-visible:ring-primary",
        className
      )}
      {...props}
    />
  )
}

export { Input }
