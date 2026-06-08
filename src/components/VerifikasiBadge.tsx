// Komponen reusable badge centang biru verifikasi
// Pakai di: ProfilPage, DetailTokoPage, ChatPage

interface Props {
  isVerified: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function VerifikasiBadge({ isVerified, size = 'sm', showLabel = false }: Props) {
  if (!isVerified) return null

  const sizeMap = {
    sm: { badge: '14px', font: '9px', pad: '1px 5px' },
    md: { badge: '18px', font: '11px', pad: '2px 7px' },
    lg: { badge: '22px', font: '13px', pad: '3px 10px' },
  }

  const s = sizeMap[size]

  if (showLabel) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        background: '#3b82f6',
        color: 'white',
        borderRadius: '99px',
        padding: s.pad,
        fontSize: s.font,
        fontWeight: 'bold',
        flexShrink: 0,
      }}>
        ✓ Terverifikasi
      </span>
    )
  }

  return (
    <span
      title="Akun Terverifikasi Lokaku"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: s.badge,
        height: s.badge,
        background: '#3b82f6',
        color: 'white',
        borderRadius: '50%',
        fontSize: s.font,
        fontWeight: 'bold',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(59,130,246,0.4)',
      }}
    >
      ✓
    </span>
  )
}
