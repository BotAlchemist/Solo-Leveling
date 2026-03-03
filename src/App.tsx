import { useState } from 'react'
import { signOut } from 'aws-amplify/auth'
import LoginPage from './pages/LoginPage'
import DailyLogPage from './pages/DailyLogPage'
import SettingsPage from './pages/SettingsPage'
import StatsPage from './pages/StatsPage'
import HelpPage from './pages/HelpPage'
import QuestsPage from './pages/QuestsPage'
import HealthPage from './pages/HealthPage'

type Page = 'login' | 'app' | 'settings' | 'stats' | 'help' | 'quests' | 'health'

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
        onHelp={() => setPage('help')}
        onQuests={() => setPage('quests')}
        onHealth={() => setPage('health')}
      />
    )
  }

  if (page === 'help') {
    return (
      <HelpPage
        onBack={() => setPage('app')}
        onLogout={handleLogout}
        onSettings={() => setPage('settings')}
        onStats={() => setPage('stats')}
        onQuests={() => setPage('quests')}
        onHealth={() => setPage('health')}
      />
    )
  }

  if (page === 'quests') {
    return (
      <QuestsPage
        onBack={() => setPage('app')}
        onLogout={handleLogout}
        onSettings={() => setPage('settings')}
        onStats={() => setPage('stats')}
        onHelp={() => setPage('help')}
        onHealth={() => setPage('health')}
      />
    )
  }

  if (page === 'health') {
    return (
      <HealthPage
        onBack={() => setPage('app')}
        onLogout={handleLogout}
        onSettings={() => setPage('settings')}
        onStats={() => setPage('stats')}
        onHelp={() => setPage('help')}
        onQuests={() => setPage('quests')}
      />
    )
  }

  return (
    <DailyLogPage
      onLogout={handleLogout}
      onSettings={() => setPage('settings')}
      onStats={() => setPage('stats')}
      onHelp={() => setPage('help')}
      onQuests={() => setPage('quests')}
      onHealth={() => setPage('health')}
    />
  )
}

export default App
