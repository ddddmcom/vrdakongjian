// 用户角色类型
export type UserRole = 'admin' | 'shop'

// 用户信息
export interface User {
  id: number
  username: string
  role: UserRole
  shopId?: number
  shopName?: string
}

// 店铺信息
export interface Shop {
  id: number
  name: string
  address: string
  contact: string
  phone: string
  adminAccount: string
  adminPassword: string
  authStartTime: string
  authEndTime: string
  shareAmount?: number
  shareRatio?: number
  suggestedPrice: number
  status: 'active' | 'inactive'
  createdAt: string
}

// VR内容
export interface VRContent {
  id: number
  title: string
  description: string
  totalLevels: number
  totalDuration: number // 分钟
  price: number
  createdAt: string
}

// VR设备
export interface VRDevice {
  id: number
  deviceCode: string // 字母+编号，如 A001, B002
  shopId: number
  status: 'online' | 'offline' | 'playing' | 'paused'
  currentContentId?: number
  currentLevel: number
  lastActiveTime: string
}

// 播放记录
export interface PlayRecord {
  id: number
  deviceId: number
  contentId: number
  shopId: number
  startTime: string
  endTime?: string
  currentLevel: number
  totalLevels: number
  isValid: boolean // 是否有效播放（≥2分钟）
  amount: number
}

// 店铺VR内容分配
export interface ShopContentAssignment {
  id: number
  shopId: number
  contentId: number
  authStartTime: string
  authEndTime: string
  price: number
  createdAt: string
}

// 统计数据
export interface Statistics {
  totalPlays: number
  totalRevenue: number
  validPlays: number
  averagePlayTime: number
  topContent: VRContent[]
  dailyStats: DailyStat[]
}

export interface DailyStat {
  date: string
  plays: number
  revenue: number
  validPlays: number
}

// API响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}