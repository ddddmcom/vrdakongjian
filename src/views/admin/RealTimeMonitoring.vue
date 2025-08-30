<template>
  <div class="monitoring">
    <div class="page-header">
      <h2>实时监控</h2>
      <div class="refresh-controls">
        <el-switch 
          v-model="autoRefresh" 
          active-text="自动刷新"
          @change="toggleAutoRefresh"
        />
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          手动刷新
        </el-button>
      </div>
    </div>

    <!-- 概览统计 -->
    <el-row :gutter="20" class="overview-stats">
      <el-col :span="6">
        <el-card>
          <el-statistic title="在线设备" :value="onlineDevices" suffix="台">
            <template #prefix>
              <el-icon style="color: #67c23a"><VideoPlay /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="播放中设备" :value="playingDevices" suffix="台">
            <template #prefix>
              <el-icon style="color: #e6a23c"><Monitor /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="今日播放次数" :value="todayPlays" suffix="次">
            <template #prefix>
              <el-icon style="color: #409eff"><DataAnalysis /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="今日收益" :value="todayRevenue" prefix="¥" :precision="2">
            <template #prefix>
              <el-icon style="color: #f56c6c"><Money /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 店铺监控列表 -->
    <el-card class="shop-monitoring">
      <template #header>
        <span>店铺实时状态</span>
      </template>
      
      <el-table :data="shopMonitorData" v-loading="loading">
        <el-table-column prop="shopName" label="店铺名称" min-width="150" />
        <el-table-column prop="shopAddress" label="地址" min-width="200" />
        <el-table-column label="设备状态" width="200">
          <template #default="{ row }">
            <div class="device-status">
              <el-tag type="success" size="small">在线: {{ row.onlineCount }}</el-tag>
              <el-tag type="warning" size="small">播放: {{ row.playingCount }}</el-tag>
              <el-tag type="info" size="small">离线: {{ row.offlineCount }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="今日数据" width="200">
          <template #default="{ row }">
            <div>播放: {{ row.todayPlays }}次</div>
            <div>收益: ¥{{ row.todayRevenue }}</div>
          </template>
        </el-table-column>
        <el-table-column label="店铺状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="viewShopDetail(row)">详情</el-button>
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="toggleShopStatus(row)"
            >
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 实时播放记录 -->
    <el-card class="real-time-records" style="margin-top: 20px;">
      <template #header>
        <span>实时播放记录</span>
      </template>
      
      <el-table :data="realtimeRecords" v-loading="recordsLoading" max-height="400">
        <el-table-column prop="shopName" label="店铺" width="120" />
        <el-table-column prop="deviceCode" label="设备" width="100" />
        <el-table-column prop="contentTitle" label="内容" min-width="150" />
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="currentLevel" label="当前关卡" width="100">
          <template #default="{ row }">
            {{ row.currentLevel }}/{{ row.totalLevels }}
          </template>
        </el-table-column>
        <el-table-column label="播放时长" width="100">
          <template #default="{ row }">
            {{ calculateDuration(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getRecordStatusType(row.status)">
              {{ getRecordStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 店铺详情对话框 -->
    <ShopDetailDialog 
      v-model="showDetailDialog"
      :shop="selectedShop"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, 
  VideoPlay, 
  Monitor, 
  DataAnalysis, 
  Money 
} from '@element-plus/icons-vue'
import type { Shop, PlayRecord } from '@/types'
import ShopDetailDialog from '@/components/ShopDetailDialog.vue'

const loading = ref(false)
const recordsLoading = ref(false)
const autoRefresh = ref(true)
const showDetailDialog = ref(false)
const selectedShop = ref<Shop | null>(null)

// 统计数据
const onlineDevices = ref(0)
const playingDevices = ref(0)
const todayPlays = ref(0)
const todayRevenue = ref(0)

// 店铺监控数据
const shopMonitorData = ref<any[]>([])
const realtimeRecords = ref<PlayRecord[]>([])

let refreshTimer: number | null = null

onMounted(() => {
  loadMonitoringData()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

const loadMonitoringData = async () => {
  loading.value = true
  try {
    // 这里应该调用实际的API获取监控数据
    // 模拟数据
    onlineDevices.value = 45
    playingDevices.value = 12
    todayPlays.value = 128
    todayRevenue.value = 2560.00
    
    shopMonitorData.value = [
      {
        id: 1,
        shopName: '体验店A',
        shopAddress: '北京市朝阳区xxx',
        onlineCount: 3,
        playingCount: 1,
        offlineCount: 0,
        todayPlays: 15,
        todayRevenue: 300,
        status: 'active'
      }
    ]
  } catch (error) {
    ElMessage.error('加载监控数据失败')
  } finally {
    loading.value = false
  }
}

const loadRealtimeRecords = async () => {
  recordsLoading.value = true
  try {
    // 这里应该获取实时播放记录
    // 模拟数据
    realtimeRecords.value = []
  } catch (error) {
    ElMessage.error('加载播放记录失败')
  } finally {
    recordsLoading.value = false
  }
}

const refreshData = () => {
  loadMonitoringData()
  loadRealtimeRecords()
}

const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    refreshData()
  }, 10000) // 每10秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const viewShopDetail = (shop: any) => {
  selectedShop.value = shop
  showDetailDialog.value = true
}

const toggleShopStatus = async (shop: any) => {
  const newStatus = shop.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '停用'
  
  try {
    await ElMessageBox.confirm(`确认${action}店铺 "${shop.shopName}" 吗？`, '确认操作')
    
    // 这里应该调用API更新店铺状态
    ElMessage.success(`${action}成功`)
    loadMonitoringData()
  } catch (error) {
    // 用户取消操作
  }
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const calculateDuration = (startTime: string) => {
  const start = new Date(startTime)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60)
  return `${diff} 分钟`
}

const getRecordStatusType = (status: string) => {
  const typeMap: { [key: string]: string } = {
    playing: 'warning',
    paused: 'info',
    completed: 'success',
    stopped: 'danger'
  }
  return typeMap[status] || 'info'
}

const getRecordStatusText = (status: string) => {
  const textMap: { [key: string]: string } = {
    playing: '播放中',
    paused: '暂停',
    completed: '完成',
    stopped: '停止'
  }
  return textMap[status] || '未知'
}
</script>

<style scoped>
.monitoring {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.refresh-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.overview-stats {
  margin-bottom: 20px;
}

.device-status {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.shop-monitoring,
.real-time-records {
  margin-top: 20px;
}
</style>