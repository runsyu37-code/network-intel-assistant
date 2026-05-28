import client from './client'
import type { CameraApi, PingLogApi } from './types'

export async function getCameras(params?: { Site_ID?: string; Floor_ID?: string; status?: string }): Promise<CameraApi[]> {
  const res = await client.get<CameraApi[]>('/cameras', { params })
  return res.data
}

export async function getCameraById(id: number): Promise<CameraApi | null> {
  const res = await client.get<CameraApi[]>('/cameras', { params: { id } })
  return res.data[0] ?? null
}

export async function createCamera(body: {
  device_name: string
  ip_address?: string
  model?: string
  install_location?: string
  NVR_ID?: string
  Site_ID: string
  Floor_ID?: string
}): Promise<void> {
  await client.post('/cameras', [body])
}

export async function updateCamera(id: number, body: {
  device_name?: string
  ip_address?: string
  model?: string
  install_location?: string
  NVR_ID?: string
}): Promise<void> {
  await client.post(`/cameras/${id}`, body)
}

export async function deleteCamera(id: number): Promise<void> {
  await client.post(`/cameras/delete/${id}`)
}

export async function getPingLogs(cameraId: number): Promise<PingLogApi[]> {
  const res = await client.get<PingLogApi[]>('/ping-logs', {
    params: { device_id: String(cameraId), device_type: 'camera' },
  })
  return res.data
}

export async function patchCameraPosition(id: number, x: number, y: number) {
  const res = await client.patch(`/cameras/${id}/position`, { x, y })
  return res.data
}
