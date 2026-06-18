import { useState } from 'react'

export default function RefreshButton() {
  const [spinning, setSpinning] = useState(false)

  function handleRefresh() {
    if (spinning) return
    setSpinning(true)
    // Beri animasi sebentar lalu reload
    setTimeout(() => {
      window.location.reload()
    }, 400)
  }

  return (
    <button
      onClick={handleRefresh}
      title="Refresh halaman"
      className="fixed bottom-24 right-4 z-50 w-11 h-11 bg-white border-2 border-gray-100 rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 hover:border-green-300 transition active:scale-95"
    >
      <span
        className={`text-lg transition-transform duration-500 ${spinning ? 'animate-spin' : ''}`}
        style={{ display: 'inline-block' }}
      >
        🔄
      </span>
    </button>
  )
}
