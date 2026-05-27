import client from './client'
import type { UserApi } from './types'

export async function getUsers(params?: { role?: string }): Promise<UserApi[]> {
  const res = await client.get<UserApi[]>('/users', { params })
  return res.data
}
