import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import LupaPasswordPage from './pages/LupaPasswordPage'
import DashboardPage from './pages/DashboardPage'
import BuatTokoPage from './pages/BuatTokoPage'
import CariTokoPage from './pages/CariTokoPage'
import TambahProdukPage from './pages/TambahProdukPage'
import DetailTokoPage from './pages/DetailTokoPage'
import PetaPage from './pages/PetaPage'
import EditTokoPage from './pages/EditTokoPage'
import ProdukPage from './pages/ProdukPage'
import ProfilPage from './pages/ProfilPage'
import ChatPage from './pages/ChatPage'
import VerifikasiPage from './pages/VerifikasiPage'
import AdminPage from './pages/AdminPage'
import PusatBantuan from './pages/PusatBantuan'
import VerifikasiWA from './pages/VerifikasiWA'
import BuatPromoPage from './pages/BuatPromoPage'
import KeranjangPage from './pages/KeranjangPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lupa-password" element={<LupaPasswordPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/cari" element={<CariTokoPage />} />
        <Route path="/peta" element={<PetaPage />} />
        <Route path="/toko/:id" element={<DetailTokoPage />} />
        <Route path="/verifikasi-wa" element={<VerifikasiWA />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/buat-toko" element={<BuatTokoPage />} />
        
        {/* Rute Dinamis */}
        <Route path="/buat-promo/:id" element={<BuatPromoPage />} />
        <Route path="/edit-toko/:id" element={<EditTokoPage />} />
        <Route path="/kelola-produk/:id" element={<ProdukPage />} />
        
        {/* Menggunakan ChatPage untuk list chat penjual */}
        <Route path="/chat-list-penjual/:id" element={<ChatPage />} />
        
        <Route path="/tambah-produk" element={<TambahProdukPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/chat/:tokoId" element={<ChatPage />} />
        <Route path="/verifikasi" element={<VerifikasiPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/pusat-bantuan" element={<PusatBantuan />} />
        <Route path="/keranjang" element={<KeranjangPage />} />
      </Routes>
    </>
  )
}

export default App