import client from './client'
import type { UserApi } from './types'

export async function getUsers(params?: { role?: string }): Promise<UserApi[]> {
  const res = await client.get<UserApi[]>('/users', { params })
  return res.data
}

export async function createUser(body: {
  username: string
  password: string
  display_name: string
  role: string
}): Promise<void> {
  await client.post('/users', [body])
}

export async function updateUser(id: number, body: {
  display_name?: string
  role?: string
  is_active?: boolean
}): Promise<void> {
  await client.post(`/users/${id}`, body)
}

export async function deleteUser(id: number): Promise<void> {
  await client.post(`/users/delete/${id}`)
}
