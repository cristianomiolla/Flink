import { AppRoutes } from './components/AppRoutes'
import { MobileNavbar } from './components/MobileNavbar'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'
import './components/MobileLayout.css'

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <AppRoutes />
        <MobileNavbar />
      </div>
    </AuthProvider>
  )
}

export default App
