import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { ClientAuthProvider } from './hooks/useClientAuth'
import './i18n'
// import './i18n/index.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ClientAuthProvider>
          <App />
        </ClientAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
