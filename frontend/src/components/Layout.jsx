import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { AXIOS_API_ROOT } from '../utils/axios'

const Layout = ({ children }) => {
  const { isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const apiOrigin = (() => { try { return new URL(AXIOS_API_ROOT).origin } catch { return AXIOS_API_ROOT } })()
  const isDev = typeof window !== 'undefined' && (import.meta?.env?.DEV || appOrigin.includes('localhost'))
  const showApiMismatch = isDev && apiOrigin && appOrigin && apiOrigin !== appOrigin
  const [dismissed, setDismissed] = useState(false)
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    IMIP
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Intelligent Meeting Insights Platform
                  </p>
                </div>
              </div>
              
              {/* Navigation Links */}
              {user && (
                <nav className="hidden md:flex items-center space-x-1">
                  <button
                    onClick={() => navigate('/')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === '/'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    Home
                  </button>
                  
                  {user.role === 'admin' && (
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/admin/dashboard'
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      Admin Dashboard
                    </button>
                  )}
                  
                  {(user.role === 'manager' || user.role === 'admin') && user.role !== 'admin' && (
                    <button
                      onClick={() => navigate('/manager/dashboard')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/manager/dashboard'
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      Manager Dashboard
                    </button>
                  )}
                </nav>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-success-50 dark:bg-success-900/20 rounded-full">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-success-700 dark:text-success-300">
                  API Connected
                </span>
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showUserMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1 capitalize">
                            {user.role}
                          </p>
                        </div>
                        
                        <div className="py-1">
                          {/* Mobile navigation links */}
                          <div className="md:hidden border-b border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => {
                                navigate('/');
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              <span>Home</span>
                            </button>
                            
                            {user.role === 'admin' && (
                              <button
                                onClick={() => {
                                  navigate('/admin/dashboard');
                                  setShowUserMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Admin Dashboard</span>
                              </button>
                            )}
                            
                            {(user.role === 'manager' || user.role === 'admin') && user.role !== 'admin' && (
                              <button
                                onClick={() => {
                                  navigate('/manager/dashboard');
                                  setShowUserMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Manager Dashboard</span>
                              </button>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dev-only API mismatch banner */}
      {showApiMismatch && !dismissed && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-sm">
            <div>
              Using API <span className="font-mono font-semibold">{apiOrigin}</span> while app is served from <span className="font-mono font-semibold">{appOrigin}</span>.
              <span className="ml-2 opacity-80">If this is unexpected, update VITE_API_ROOT.</span>
            </div>
            <button onClick={() => setDismissed(true)} className="px-2 py-1 text-xs rounded hover:bg-yellow-100 dark:hover:bg-yellow-800/50">Dismiss</button>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 IMIP. Powered by AI.
            </p>
            <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <button 
                onClick={() => navigate('/documentation')}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Documentation
              </button>
              <button 
                onClick={() => navigate('/status-page')}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                API Status
              </button>
              {user?.role !== 'admin' && (
                <button 
                  onClick={() => navigate('/support')}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Support
                </button>
              )}
              {user?.role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin/support')}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Support Management
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
