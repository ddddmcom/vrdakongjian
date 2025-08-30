import api from './index'
import type { ApiResponse, User } from '@/types'

export const authApi = {
  // 登录
  login(username: string, password: string): Promise<ApiResponse<{user: User, token: string}>> {
    return api.post('/auth/login', { username, password })
  },

  // 获取用户信息
  getUserInfo(): Promise<ApiResponse<User>> {
    return api.get('/auth/user')
  },

  // 修改密码
  changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
    return api.post('/auth/change-password', { oldPassword, newPassword })
  }
}