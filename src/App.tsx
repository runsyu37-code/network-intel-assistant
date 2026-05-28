import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd'
import { useThemeStore } from './stores/themeStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

const antdTokens = {
  light: {
    colorPrimary:        '#8B44AA',
    colorSuccess:        '#16a34a',
    colorWarning:        '#d97706',
    colorError:          '#dc2626',
    colorBgBase:         '#ffffff',
    colorBgLayout:       '#f8f5fc',
    colorBorder:         '#e4ddef',
    colorText:           '#1a0d2e',
    colorTextSecondary:  '#4a3866',
    colorTextTertiary:   '#9180aa',
    borderRadius:        7,
    fontFamily:          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize:            13,
  },
  dark: {
    colorPrimary:        '#b06fd4',
    colorSuccess:        '#34d399',
    colorWarning:        '#fbbf24',
    colorError:          '#f87171',
    colorBgBase:         '#150f22',
    colorBgLayout:       '#0d0a17',
    colorBorder:         '#302550',
    colorText:           '#f0eaf8',
    colorTextSecondary:  '#c0aed8',
    colorTextTertiary:   '#8a74a8',
    borderRadius:        7,
    fontFamily:          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize:            13,
  },
}

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: antdTokens[theme],
      }}
    >
      <AntApp>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AntApp>
    </ConfigProvider>
  )
}
