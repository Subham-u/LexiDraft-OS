import { Route } from 'wouter'
import { Toaster } from '@/components/ui/toaster'
import { NotificationProvider } from './components/notifications/NotificationProvider'
import { Header } from './components/layout/Header'

// Import pages
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Contracts from './pages/Contracts'
import ContractDetail from './pages/ContractDetail'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <NotificationProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/contracts" component={Contracts} />
          <Route path="/contracts/:id" component={ContractDetail} />
          <Route path="/settings" component={Settings} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
        </main>
        <Toaster />
      </div>
    </NotificationProvider>
  )
}

export default App