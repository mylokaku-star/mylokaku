import { useNavigate } from 'react-router-dom'

export default function BackButton({ to }: { to?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => to ? navigate(to) : navigate(-1)}
      className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
    >
      &larr;
    </button>
  )
}