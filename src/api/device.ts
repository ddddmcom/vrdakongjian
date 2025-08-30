import api from './index'
import type { ApiResponse, VRDevice, PlayRecord } from '@/types'

export const deviceApi = {
  // 获取店铺设备列表
  getShopDevices(shopId: number): Promise<ApiResponse<VRDevice[]>> {
    return api.get(`/shops/${shopId}/devices`)
  },

  // 创建设备
  createDevice(device: Partial<VRDevice>): Promise<ApiResponse<VRDevice>> {
    return api.post('/devices', device)
  },

  // 更新设备
  updateDevice(id: number, device: Partial<VRDevice>): Promise<ApiResponse<VRDevice>> {
    return api.put(`/devices/${id}`, device)
  },

  // 删除设备
  deleteDevice(id: number): Promise<ApiResponse> {
    return api.delete(`/devices/${id}`)
  },

  // 控制设备播放
  controlDevice(deviceId: number, action: 'play' | 'pause' | 'stop', contentId?: number): Promise<ApiResponse> {
    return api.post(`/devices/${deviceId}/control`, { action, contentId })
  },

  // 获取设备播放记录
  getDevicePlayRecords(deviceId: number, page: number = 1, size: number = 10): Promise<ApiResponse<{list: PlayRecord[], total: number}>> {
    return api.get(`/devices/${deviceId}/records?page=${page}&size=${size}`)
  },

  // 获取实时设备状态
  getDeviceStatus(deviceId: number): Promise<ApiResponse<VRDevice>> {
    return api.get(`/devices/${deviceId}/status`)
  }
}