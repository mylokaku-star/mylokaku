import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BuatTokoPage from './pages/BuatTokoPage'
import CariTokoPage from './pages/CariTokoPage'
import TambahProdukPage from './pages/TambahProdukPage'
import DetailTokoPage from './pages/DetailTokoPage'
import PetaPage from './pages/PetaPage'
import EditTokoPage from './pages/EditTokoPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/cari" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/buat-toko" element={<BuatTokoPage />} />
      <Route path="/cari" element={<CariTokoPage />} />
      <Route path="/tambah-produk" element={<TambahProdukPage />} />
      <Route path="/toko/:id" element={<DetailTokoPage />} />
      <Route path="/peta" element={<PetaPage />} />
      <Route path="/edit-toko" element={<EditTokoPage />} />
    </Routes>
  )
}

export default App