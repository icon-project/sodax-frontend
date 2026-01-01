"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      icons={{
        success: null,
        error: null,
        warning: null,
        info: null,
        loading: null,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'cursor-pointer rounded-xl border px-4 py-3 shadow-lg w-72 transition-transform duration-300 ease-out',
          title: 'font-semibold block mb-0.5',
          description: 'text-sm opacity-90',
          success: 'bg-cherry-bright text-cream-white border-cherry-soda',
          error: 'bg-negative text-white border-red-700',
          info: 'bg-white text-yellow-dark border-gray-200',
          warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }