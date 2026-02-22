import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import DailyLogPage from './pages/DailyLogPage'

type Page = 'login' | 'app'

function App() {
  const [page, setPage] = useState<Page>('login')

  if (page === 'login') {
    return <LoginPage onLogin={() => setPage('app')} />
  }

  return <DailyLogPage />
}

export default App
