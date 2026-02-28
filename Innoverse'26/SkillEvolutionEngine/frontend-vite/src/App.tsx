import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import AuthModal from './AuthModal'
import Onboarding from './Onboarding'
import './index.css'

function App() {
  const [currentView, setCurrentView] = useState<'onboarding' | 'dashboard'>('dashboard')
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(!localStorage.getItem('token'))

  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.skills && data.skills.length > 0) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('onboarding');
        }
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setShowAuth(true);
      }
    } catch (err) {
      console.error(err);
      setShowAuth(true);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    }
  }, []);

  return (
    <>
      {currentView === 'onboarding' && (
        <Onboarding user={user} onComplete={() => {
          const token = localStorage.getItem('token');
          if (token) fetchUserProfile(token);
        }} />
      )}

      {currentView === 'dashboard' && (
        <Dashboard user={user} onLogout={() => {
          localStorage.removeItem('token');
          setUser(null);
          setShowAuth(true);
        }} />
      )}

      {showAuth && (
        <AuthModal onSuccess={() => {
          setShowAuth(false);
          const token = localStorage.getItem('token');
          if (token) fetchUserProfile(token);
        }} />
      )}
    </>
  )
}

export default App
