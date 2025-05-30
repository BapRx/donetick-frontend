import NavBar from '@/views/components/NavBar'
import { Button, Snackbar, Typography, useColorScheme } from '@mui/joy'
import Tracker from '@openreplay/tracker'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { registerCapacitorListeners } from './CapacitorListener'
import { UserContext } from './contexts/UserContext'
import { useResource } from './queries/ResourceQueries'
import { AuthenticationProvider } from './service/AuthenticationService'
import { ErrorProvider } from './service/ErrorProvider'
import { GetUserProfile } from './utils/Fetcher'
import { apiManager, isTokenValid } from './utils/TokenManager'
import NetworkBanner from './views/components/NetworkBanner'
const add = className => {
  document.getElementById('root').classList.add(className)
}

const remove = className => {
  document.getElementById('root').classList.remove(className)
}
// TODO: Update the interval to at 60 minutes
const intervalMS = 5 * 60 * 1000 // 5 minutes

function App() {
  const resource = useResource()
  const navigate = useNavigate()
  startApiManager(navigate)
  startOpenReplay()
  const queryClient = new QueryClient()
  const { mode, systemMode } = useColorScheme()
  const [userProfile, setUserProfile] = useState(null)
  const [showUpdateSnackbar, setShowUpdateSnackbar] = useState(true)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r)
      r &&
        setInterval(() => {
          r.update()
        }, intervalMS)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })
  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  const setThemeClass = () => {
    const value = JSON.parse(localStorage.getItem('themeMode')) || mode

    if (value === 'system') {
      if (systemMode === 'dark') {
        return add('dark')
      }
      return remove('dark')
    }

    if (value === 'dark') {
      return add('dark')
    }

    return remove('dark')
  }
  const getUserProfile = () => {
    GetUserProfile()
      .then(res => {
        res.json().then(data => {
          setUserProfile(data.res)
        })
      })
      .catch(error => {})
  }
  useEffect(() => {
    setThemeClass()
  }, [mode, systemMode])
  useEffect(() => {
    registerCapacitorListeners()
    if (isTokenValid()) {
      if (!userProfile) getUserProfile()
    }
  }, [])

  return (
    <div className='min-h-screen'>
      <NetworkBanner />
      <QueryClientProvider client={queryClient}>
        <AuthenticationProvider />
        <ErrorProvider>
          <UserContext.Provider value={{ userProfile, setUserProfile }}>
            <NavBar />
            <Outlet />
          </UserContext.Provider>
        </ErrorProvider>
        {needRefresh && (
          <Snackbar open={showUpdateSnackbar}>
            <Typography level='body-md'>
              A new version is now available.Click on reload button to update.
            </Typography>
            <Button
              color='secondary'
              size='small'
              onClick={() => {
                updateServiceWorker(true)
                setShowUpdateSnackbar(false)
              }}
            >
              Refresh
            </Button>
          </Snackbar>
        )}
      </QueryClientProvider>
    </div>
  )
}

const startOpenReplay = () => {
  if (!import.meta.env.VITE_OPENREPLAY_PROJECT_KEY) return
  const tracker = new Tracker({
    projectKey: import.meta.env.VITE_OPENREPLAY_PROJECT_KEY,
  })
  tracker.start()
}
export default App

const startApiManager = navigate => {
  apiManager.init()
  apiManager.setNavigateToLogin(() => {
    navigate('/login')
  })
}
