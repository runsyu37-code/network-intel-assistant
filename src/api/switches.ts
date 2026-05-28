import client from './client'
import type { PoeSwitchApi } from './types'

export async function getSwitches(params?: { Site_ID?: string; Rack_ID?: string; status?: string }): Promise<PoeSwitchApi[]> {
  const res = await client.get<PoeSwitchApi[]>('/poe-switches', { params })
  return res.data
}

export async function createSwitch(body: {
  SW_ID: string
  device_name: string
  ip_address?: string
  model?: string
  total_ports?: number
  poe_budget_w?: number
  Site_ID: string
  Rack_ID?: string
}): Promise<void> {
  await client.post('/poe-switches', [body])
}

export async function updateSwitch(id: string, body: {
  device_name?: string
  ip_address?: string
  model?: string
  total_ports?: number
  poe_budget_w?: number
}): Promise<void> {
  await client.post(`/poe-switches/${id}`, body)
}

export async function deleteSwitch(id: string): Promise<void> {
  await client.post(`/poe-switches/delete/${id}`)
}
