'use client'

type NotificationProps = {
  type: 'success' | 'error' | 'warning' | null
  message: string | null
}

export function Notification({ type, message }: NotificationProps) {
  if (!type || !message) return null

  return (
    <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-yellow-500'
    } text-white z-50 transition-opacity duration-300`}>
      {message}
    </div>
  )
}
