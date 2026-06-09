import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/buat-toko" element={<BuatTokoPage />} />
      <Route path="/cari" element={<CariTokoPage />} />
      <Route path="/tambah-produk" element={<TambahProdukPage />} />
      <Route path="/toko/:id" element={<DetailTokoPage />} />
      <Route path="/peta" element={<PetaPage />} />
      <Route path="/edit-toko" element={<EditTokoPage />} />
      <Route path="/produk" element={<ProdukPage />} />
      <Route path="/profil" element={<ProfilPage />} />
      <Route path="/chat/:tokoId" element={<ChatPage />} />
      <Route path="/verifikasi" element={<VerifikasiPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
