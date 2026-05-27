import client from './client'
import type { LoginResponse } from './types'

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>('/auth/login', { username, password })
  return res.data
}

function parseJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

export function extractJwtUser(token: string): {
  id: number
  username: string
  role: 'admin' | 'user' | 'viewer'
  displayName: string
} {
  const p = parseJwt(token)
  const username = (
    p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    p['unique_name'] ||
    ''
  ) as string
  const idStr = (
    p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
    p['nameid'] ||
    '0'
  ) as string
  const rawRole = (
    p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    p['role'] ||
    'viewer'
  ) as string
  const role: 'admin' | 'user' | 'viewer' =
    rawRole === 'admin' || rawRole === 'user' || rawRole === 'viewer' ? rawRole : 'viewer'
  return { id: parseInt(idStr, 10) || 0, username, role, displayName: username }
}
