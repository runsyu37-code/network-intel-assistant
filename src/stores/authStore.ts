import { create } from 'zustand'

interface User {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'user' | 'viewer'
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAdmin: () => boolean
  canEdit: () => boolean
}

function loadUser(): User | null {
  try {
    const s = localStorage.getItem('user')
    return s ? (JSON.parse(s) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadUser(),
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
  isAdmin: () => get().user?.role === 'admin',
  canEdit: () => {
    const role = get().user?.role
    return role === 'admin' || role === 'user'
  },
}))
