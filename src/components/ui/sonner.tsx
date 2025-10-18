"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-amber-500 group-[.toaster]:via-orange-500 group-[.toaster]:to-red-500 group-[.toaster]:text-white group-[.toaster]:border-4 group-[.toaster]:border-amber-400 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-amber-500/50 group-[.toaster]:animate-pulse group-[.toaster]:text-2xl group-[.toaster]:font-black group-[.toaster]:py-6 group-[.toaster]:px-8",
          description: "group-[.toast]:text-white/90 group-[.toast]:text-lg",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-orange-600 group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-white/20 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
