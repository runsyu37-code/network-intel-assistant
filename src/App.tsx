import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { useThemeStore } from './stores/themeStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

const antdTokens = {
  light: {
    colorPrimary:        '#2563eb',
    colorSuccess:        '#16a34a',
    colorWarning:        '#d97706',
    colorError:          '#dc2626',
    colorBgBase:         '#ffffff',
    colorBgLayout:       '#f7f8fa',
    colorBorder:         '#e6e8ec',
    colorText:           '#0f172a',
    colorTextSecondary:  '#475569',
    colorTextTertiary:   '#94a3b8',
    borderRadius:        7,
    fontFamily:          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize:            13,
  },
  dark: {
    colorPrimary:        '#5b8def',
    colorSuccess:        '#34d399',
    colorWarning:        '#fbbf24',
    colorError:          '#f87171',
    colorBgBase:         '#11151f',
    colorBgLayout:       '#0b0e16',
    colorBorder:         '#232938',
    colorText:           '#f1f3f8',
    colorTextSecondary:  '#b3bbcc',
    colorTextTertiary:   '#7c8499',
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/*" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ConfigProvider>
  )
}
