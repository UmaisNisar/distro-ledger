import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { App } from './App'
import { AdminProvider } from './auth/AdminContext'
import { AuthProvider } from './auth/AuthContext'
import { ThemeModeProvider, useThemeMode } from './theme/ThemeModeProvider'
import { initTheme } from './theme/theme'
import './index.css'

initTheme()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
})

function AppToaster() {
  const { mode } = useThemeMode()
  return (
    <Toaster
      theme={mode}
      position="top-right"
      richColors
      closeButton
      toastOptions={{ style: { fontFamily: 'var(--font-app)' } }}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <BrowserRouter>
          <AdminProvider>
            <AuthProvider>
              <App />
              <AppToaster />
            </AuthProvider>
          </AdminProvider>
        </BrowserRouter>
      </ThemeModeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
