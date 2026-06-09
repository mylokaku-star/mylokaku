// src/hooks/useVerifikasiWA.ts
// Hook cek status verifikasi NOMOR WA pendaftar
// TERPISAH dari sistem badge toko (VerifikasiBadge / VerifikasiPage)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

interface StatusWA {
  isVerified: boolean | null; // null = masih loading
  isLoading: boolean;
  nomorWA: string | null;
  sudahRequest: boolean;
}

export function useVerifikasiWA(): StatusWA {
  const [state, setState] = useState<StatusWA>({
    isVerified: null,
    isLoading: true,
    nomorWA: null,
    sudahRequest: false,
  });

  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel>;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ isVerified: false, isLoading: false, nomorWA: null, sudahRequest: false });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_verified, nomor_wa, verification_requested_at")
        .eq("id", user.id)
        .single();

      setState({
        isVerified: data?.is_verified ?? false,
        isLoading: false,
        nomorWA: data?.nomor_wa ?? null,
        sudahRequest: !!data?.verification_requested_at,
      });

      // Realtime: update hook otomatis saat admin approve
      ch = supabase
        .channel(`wa-hook-${user.id}`)
        .on("postgres_changes", {
          event: "UPDATE", schema: "public",
          table: "profiles", filter: `id=eq.${user.id}`,
        }, (payload) => {
          const p = payload.new as {
            is_verified: boolean;
            nomor_wa: string;
            verification_requested_at: string;
          };
          setState({
            isVerified: p.is_verified,
            isLoading: false,
            nomorWA: p.nomor_wa,
            sudahRequest: !!p.verification_requested_at,
          });
        })
        .subscribe();
    };

    init();
    return () => { if (ch) supabase.removeChannel(ch); };
  }, []);

  return state;
}

// ─────────────────────────────────────────────────────────────────
// Komponen siap pakai: gate fitur yang butuh verifikasi WA
// Taruh di src/components/ButuhVerifikasiWA.tsx jika mau pisah file
// ─────────────────────────────────────────────────────────────────
import { useVerifikasiWA } from "../hooks/useVerifikasiWA";

interface Props {
  children: React.ReactNode;
  /** Pesan custom saat belum terverifikasi */
  pesan?: string;
}

export function ButuhVerifikasiWA({ children, pesan }: Props) {
  const { isVerified, isLoading } = useVerifikasiWA();
  const navigate = useNavigate();

  if (isLoading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
      Memuat...
    </div>
  );

  if (!isVerified) return (
    <div style={{
      textAlign: "center", padding: "3rem",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📱</div>
      <p style={{ color: "#374151", fontSize: "0.95rem", marginBottom: "1rem" }}>
        {pesan ?? "Kamu perlu verifikasi nomor WhatsApp dulu untuk mengakses fitur ini."}
      </p>
      <button
        onClick={() => navigate("/verifikasi-wa")}
        style={{
          background: "#10b981", color: "#fff", border: "none",
          borderRadius: "10px", padding: "0.7rem 1.5rem",
          fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Verifikasi Sekarang →
      </button>
    </div>
  );

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────
// CONTOH PEMAKAIAN
// ─────────────────────────────────────────────────────────────────
//
// A) Gate halaman dengan wrapper:
//
//    import { ButuhVerifikasiWA } from "../hooks/useVerifikasiWA";
//
//    export default function BuatTokoPage() {
//      return (
//        <ButuhVerifikasiWA pesan="Verifikasi WA dulu untuk membuat toko.">
//          <FormBuatToko />
//        </ButuhVerifikasiWA>
//      );
//    }
//
// ─────────────────────────────────────────────────────────────────
//
// B) Pakai hook langsung (lebih fleksibel):
//
//    import { useVerifikasiWA } from "../hooks/useVerifikasiWA";
//
//    export default function ChatPage() {
//      const { isVerified, isLoading } = useVerifikasiWA();
//      if (isLoading) return <Spinner />;
//      if (!isVerified) return <p>Belum terverifikasi</p>;
//      return <ChatUI />;
//    }
//
// ─────────────────────────────────────────────────────────────────
//
// C) Di App.tsx — tambah route:
//
//    import VerifikasiWA from "./pages/VerifikasiWA";
//    <Route path="/verifikasi-wa" element={<VerifikasiWA />} />
//
// ─────────────────────────────────────────────────────────────────
//
// D) Admin cara approve — via SQL Editor Supabase:
//
//    UPDATE profiles
//    SET is_verified = true, verified_at = NOW()
//    WHERE nomor_wa = '628xxxxx';
//
//    -- Lihat antrian yang perlu diverifikasi:
//    SELECT nama, email, nomor_wa, verification_requested_at
//    FROM profiles
//    WHERE is_verified = false
//      AND verification_requested_at IS NOT NULL
//    ORDER BY verification_requested_at ASC;
