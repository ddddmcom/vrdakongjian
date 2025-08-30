<template>
  <div class="device-control">
    <div class="page-header">
      <h2>VR设备控制</h2>
      <div class="status-summary">
        <el-tag type="success">在线: {{ onlineCount }}</el-tag>
        <el-tag type="info">离线: {{ offlineCount }}</el-tag>
        <el-tag type="warning">播放中: {{ playingCount }}</el-tag>
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="device-grid">
      <el-card 
        v-for="device in devices" 
        :key="device.id" 
        class="device-card"
        :class="{'playing': device.status === 'playing'}"
      >
        <template #header>
          <div class="device-header">
            <span class="device-name">{{ device.deviceCode }}</span>
            <el-tag :type="getDeviceStatusType(device.status)">
              {{ getDeviceStatusText(device.status) }}
            </el-tag>
          </div>
        </template>

        <div class="device-content">
          <!-- 当前播放内容 -->
          <div v-if="device.currentContentId" class="current-content">
            <h4>{{ getCurrentContentTitle(device.currentContentId) }}</h4>
            
            <!-- 关卡进度显示 -->
            <div class="level-progress">
              <h5>播放进度:</h5>
              <div class="level-cards">
                <div
                  v-for="level in getCurrentContentLevels(device.currentContentId)"
                  :key="level"
                  class="level-card"
                  :class="{
                    'completed': level <= device.currentLevel,
                    'current': level === device.currentLevel + 1
                  }"
                >
                  第{{ level }}关
                </div>
              </div>
            </div>

            <!-- 控制按钮 -->
            <div class="control-buttons">
              <el-button
                v-if="device.status === 'playing'"
                type="warning"
                size="small"
                @click="controlDevice(device.id, 'pause')"
                :loading="controllingDevices.has(device.id)"
              >
                <el-icon><VideoPause /></el-icon>
                暂停
              </el-button>
              
              <el-button
                v-if="device.status === 'paused'"
                type="success"
                size="small"
                @click="controlDevice(device.id, 'play')"
                :loading="controllingDevices.has(device.id)"
              >
                <el-icon><VideoPlay /></el-icon>
                继续
              </el-button>
              
              <el-button
                v-if="device.status === 'playing' || device.status === 'paused'"
                type="danger"
                size="small"
                @click="controlDevice(device.id, 'stop')"
                :loading="controllingDevices.has(device.id)"
              >
                <el-icon><CircleClose /></el-icon>
                停止
              </el-button>
            </div>
          </div>

          <!-- 空闲状态 -->
          <div v-else class="idle-content">
            <p>设备空闲</p>
            <el-select
              v-model="selectedContent[device.id]"
              placeholder="选择内容开始播放"
              style="width: 100%; margin-bottom: 10px;"
            >
              <el-option
                v-for="content in availableContent"
                :key="content.id"
                :label="content.title"
                :value="content.id"
              />
            </el-select>
            
            <el-button
              type="primary"
              size="small"
              :disabled="!selectedContent[device.id]"
              @click="startPlay(device.id)"
              :loading="controllingDevices.has(device.id)"
            >
              <el-icon><VideoPlay /></el-icon>
              开始播放
            </el-button>
          </div>

          <!-- 设备信息 -->
          <div class="device-info">
            <p><small>最后活跃: {{ formatDateTime(device.lastActiveTime) }}</small></p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 播放记录 -->
    <el-card class="play-records" style="margin-top: 20px;">
      <template #header>
        <span>今日播放记录</span>
      </template>
      
      <el-table :data="todayRecords" v-loading="recordsLoading">
        <el-table-column prop="deviceCode" label="设备" width="100" />
        <el-table-column prop="contentTitle" label="内容" />
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="180">
          <template #default="{ row }">
            {{ row.endTime ? formatDateTime(row.endTime) : '播放中' }}
          </template>
        </el-table-column>
        <el-table-column prop="currentLevel" label="播放关卡" width="100">
          <template #default="{ row }">
            {{ row.currentLevel }}/{{ row.totalLevels }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="收益" width="100">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isValid ? 'success' : 'danger'">
              {{ row.isValid ? '有效' : '无效' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  VideoPlay, 
  VideoPause, 
  CircleClose 
} from '@element-plus/icons-vue'
import type { VRDevice, VRContent, PlayRecord } from '@/types'
import { deviceApi } from '@/api/device'
import { contentApi } from '@/api/content'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const devices = ref<VRDevice[]>([])
const availableContent = ref<VRContent[]>([])
const todayRecords = ref<PlayRecord[]>([])

const loading = ref(false)
const recordsLoading = ref(false)
const controllingDevices = ref(new Set<number>())
const selectedContent = ref<{ [deviceId: number]: number }>({})

let refreshInterval: number | null = null

const onlineCount = computed(() => 
  devices.value.filter(d => d.status === 'online' || d.status === 'playing' || d.status === 'paused').length
)

const offlineCount = computed(() => 
  devices.value.filter(d => d.status === 'offline').length
)

const playingCount = computed(() => 
  devices.value.filter(d => d.status === 'playing').length
)

onMounted(() => {
  loadDevices()
  loadAvailableContent()
  loadTodayRecords()
  
  // 每5秒刷新设备状态
  refreshInterval = setInterval(() => {
    loadDevices()
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

const loadDevices = async () => {
  if (!authStore.user?.shopId) return
  
  try {
    const response = await deviceApi.getShopDevices(authStore.user.shopId)
    if (response.code === 200) {
      devices.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载设备列表失败')
  }
}

const loadAvailableContent = async () => {
  try {
    // 这里应该获取店铺已分配的内容
    const response = await contentApi.getContents()
    if (response.code === 200) {
      availableContent.value = response.data.list
    }
  } catch (error) {
    ElMessage.error('加载可用内容失败')
  }
}

const loadTodayRecords = async () => {
  recordsLoading.value = true
  try {
    // 这里应该获取今日的播放记录
    // const response = await recordApi.getTodayRecords(authStore.user?.shopId)
    // 模拟数据
    todayRecords.value = []
  } catch (error) {
    ElMessage.error('加载播放记录失败')
  } finally {
    recordsLoading.value = false
  }
}

const getDeviceStatusType = (status: string) => {
  const typeMap: { [key: string]: string } = {
    online: 'success',
    offline: 'info',
    playing: 'warning',
    paused: 'warning'
  }
  return typeMap[status] || 'info'
}

const getDeviceStatusText = (status: string) => {
  const textMap: { [key: string]: string } = {
    online: '在线',
    offline: '离线',
    playing: '播放中',
    paused: '暂停'
  }
  return textMap[status] || '未知'
}

const getCurrentContentTitle = (contentId: number) => {
  const content = availableContent.value.find(c => c.id === contentId)
  return content?.title || '未知内容'
}

const getCurrentContentLevels = (contentId: number) => {
  const content = availableContent.value.find(c => c.id === contentId)
  if (!content) return []
  
  return Array.from({ length: content.totalLevels }, (_, i) => i + 1)
}

const controlDevice = async (deviceId: number, action: 'play' | 'pause' | 'stop') => {
  controllingDevices.value.add(deviceId)
  
  try {
    const response = await deviceApi.controlDevice(deviceId, action)
    if (response.code === 200) {
      ElMessage.success(`${action === 'play' ? '播放' : action === 'pause' ? '暂停' : '停止'}成功`)
      loadDevices() // 刷新设备状态
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    controllingDevices.value.delete(deviceId)
  }
}

const startPlay = async (deviceId: number) => {
  const contentId = selectedContent.value[deviceId]
  if (!contentId) return
  
  controllingDevices.value.add(deviceId)
  
  try {
    const response = await deviceApi.controlDevice(deviceId, 'play', contentId)
    if (response.code === 200) {
      ElMessage.success('开始播放')
      selectedContent.value[deviceId] = 0 // 重置选择
      loadDevices() // 刷新设备状态
    }
  } catch (error) {
    ElMessage.error('开始播放失败')
  } finally {
    controllingDevices.value.delete(deviceId)
  }
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}
</script>

<style scoped>
.device-control {
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

.status-summary {
  display: flex;
  gap: 10px;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.device-card {
  transition: all 0.3s ease;
}

.device-card.playing {
  border-color: #f56c6c;
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.3);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-name {
  font-weight: bold;
  font-size: 16px;
}

.current-content h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.level-progress h5 {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.level-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.level-card {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: #f5f7fa;
  color: #909399;
  border: 1px solid #e4e7ed;
}

.level-card.completed {
  background-color: #67c23a;
  color: white;
  border-color: #67c23a;
}

.level-card.current {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.control-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.idle-content {
  text-align: center;
  padding: 20px 0;
}

.idle-content p {
  color: #909399;
  margin-bottom: 15px;
}

.device-info {
  border-top: 1px solid #e4e7ed;
  padding-top: 10px;
  margin-top: 15px;
}

.device-info p {
  margin: 0;
  color: #909399;
}

.play-records {
  margin-top: 20px;
}
</style>