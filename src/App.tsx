import { useState } from 'react'
import { signOut } from 'aws-amplify/auth'
import LoginPage from './pages/LoginPage'
import DailyLogPage from './pages/DailyLogPage'
import SettingsPage from './pages/SettingsPage'
import StatsPage from './pages/StatsPage'

type Page = 'login' | 'app' | 'settings' | 'stats'

function App() {
  const [page, setPage] = useState<Page>('login')

  const handleLogout = async () => {
    await signOut().catch(() => {})
    setPage('login')
  }

  if (page === 'login') {
    return <LoginPage onLogin={() => setPage('app')} />
  }

  if (page === 'settings') {
    return <SettingsPage onBack={() => setPage('app')} onLogout={handleLogout} />
  }

  if (page === 'stats') {
    return (
      <StatsPage
        onBack={() => setPage('app')}
        onLogout={handleLogout}
        onSettings={() => setPage('settings')}
      />
    )
  }

  return (
    <DailyLogPage
      onLogout={handleLogout}
      onSettings={() => setPage('settings')}
      onStats={() => setPage('stats')}
    />
  )
}

export default App
