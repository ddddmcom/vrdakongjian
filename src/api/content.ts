import api from './index'
import type { ApiResponse, VRContent } from '@/types'

export const contentApi = {
  // 获取内容列表
  getContents(page: number = 1, size: number = 10): Promise<ApiResponse<{list: VRContent[], total: number}>> {
    return api.get(`/content?page=${page}&size=${size}`)
  },

  // 创建内容
  createContent(content: Partial<VRContent>): Promise<ApiResponse<VRContent>> {
    return api.post('/content', content)
  },

  // 更新内容
  updateContent(id: number, content: Partial<VRContent>): Promise<ApiResponse<VRContent>> {
    return api.put(`/content/${id}`, content)
  },

  // 删除内容
  deleteContent(id: number): Promise<ApiResponse> {
    return api.delete(`/content/${id}`)
  },

  // 获取内容详情
  getContent(id: number): Promise<ApiResponse<VRContent>> {
    return api.get(`/content/${id}`)
  }
}