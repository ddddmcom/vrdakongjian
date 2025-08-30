import api from './index'
import type { ApiResponse, Shop, ShopContentAssignment } from '@/types'

export const shopApi = {
  // 获取店铺列表
  getShops(page: number = 1, size: number = 10): Promise<ApiResponse<{list: Shop[], total: number}>> {
    return api.get(`/shops?page=${page}&size=${size}`)
  },

  // 创建店铺
  createShop(shop: Partial<Shop>): Promise<ApiResponse<Shop>> {
    return api.post('/shops', shop)
  },

  // 更新店铺
  updateShop(id: number, shop: Partial<Shop>): Promise<ApiResponse<Shop>> {
    return api.put(`/shops/${id}`, shop)
  },

  // 删除店铺
  deleteShop(id: number): Promise<ApiResponse> {
    return api.delete(`/shops/${id}`)
  },

  // 获取店铺详情
  getShop(id: number): Promise<ApiResponse<Shop>> {
    return api.get(`/shops/${id}`)
  },

  // 分配内容给店铺
  assignContent(shopId: number, contentId: number, data: {
    authStartTime: string
    authEndTime: string
    price: number
  }): Promise<ApiResponse> {
    return api.post(`/shops/${shopId}/content/${contentId}`, data)
  },

  // 获取店铺已分配的内容
  getShopContent(shopId: number): Promise<ApiResponse<ShopContentAssignment[]>> {
    return api.get(`/shops/${shopId}/content`)
  },

  // 移除店铺内容分配
  removeShopContent(shopId: number, contentId: number): Promise<ApiResponse> {
    return api.delete(`/shops/${shopId}/content/${contentId}`)
  }
}