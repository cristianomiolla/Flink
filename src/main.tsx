import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './components/ActionButton.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/Flink">
    <App />
  </BrowserRouter>,
)
