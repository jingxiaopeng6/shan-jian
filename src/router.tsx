import { createHashRouter, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import ArPage from './pages/ArPage'
import PeakDetailPage from './pages/PeakDetailPage'
import ViewshedPage from './pages/ViewshedPage'
import NfcPage from './pages/NfcPage'
import JourneyPage from './pages/JourneyPage'
import AppLayout from './components/AppLayout'

// 使用 HashRouter：GitHub Pages 静态托管不支持 history 路由的服务端重写，
// Hash 路由天然规避刷新 / 深链 404 问题，且对 Link/useNavigate/peak/:id 无影响
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'ar', element: <ArPage /> },
      { path: 'peak/:id', element: <PeakDetailPage /> },
      { path: 'viewshed', element: <ViewshedPage /> },
      { path: 'nfc', element: <NfcPage /> },
      { path: 'journey', element: <JourneyPage /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
])
