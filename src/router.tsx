import { createBrowserRouter, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import ArPage from './pages/ArPage'
import PeakDetailPage from './pages/PeakDetailPage'
import ViewshedPage from './pages/ViewshedPage'
import NfcPage from './pages/NfcPage'
import AppLayout from './components/AppLayout'

export const router = createBrowserRouter([
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
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
])
