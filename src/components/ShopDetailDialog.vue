<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="店铺详情监控"
    width="90%"
    top="5vh"
  >
    <div v-if="shop">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card>
            <h4>{{ shop.shopName }}</h4>
            <p><strong>地址:</strong> {{ shop.shopAddress }}</p>
            <p><strong>联系人:</strong> {{ shop.contact }}</p>
            <p><strong>电话:</strong> {{ shop.phone }}</p>
          </el-card>
        </el-col>
        
        <el-col :span="16">
          <el-card>
            <template #header>
              <span>设备实时状态</span>
            </template>
            
            <div class="device-grid">
              <div 
                v-for="device in devices" 
                :key="device.id"
                class="device-item"
                :class="device.status"
              >
                <div class="device-code">{{ device.deviceCode }}</div>
                <div class="device-status">{{ getDeviceStatusText(device.status) }}</div>
                <div v-if="device.currentContentTitle" class="current-content">
                  {{ device.currentContentTitle }}
                </div>
                <div class="last-active">
                  {{ formatTime(device.lastActiveTime) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 播放记录 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <span>今日播放记录</span>
        </template>
        
        <el-table :data="playRecords" v-loading="loading">
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
          <el-table-column prop="amount" label="收益" width="100">
            <template #default="{ row }">
              ¥{{ row.amount }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Shop, VRDevice, PlayRecord } from '@/types'

interface Props {
  modelValue: boolean
  shop: Shop | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const loading = ref(false)
const devices = ref<VRDevice[]>([])
const playRecords = ref<PlayRecord[]>([])

watch(() => props.modelValue, (val) => {
  if (val && props.shop) {
    loadShopData()
  }
})

const loadShopData = async () => {
  if (!props.shop) return
  
  loading.value = true
  try {
    // 这里应该加载店铺的设备和播放记录数据
    // 模拟数据
    devices.value = []
    playRecords.value = []
  } catch (error) {
    console.error('加载店铺数据失败:', error)
  } finally {
    loading.value = false
  }
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

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString()
}
</script>

<style scoped>
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.device-item {
  padding: 15px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
}

.device-item.online {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.device-item.playing {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.device-item.offline {
  border-color: #909399;
  background-color: #f5f7fa;
}

.device-code {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.device-status {
  color: #606266;
  font-size: 14px;
  margin-bottom: 5px;
}

.current-content {
  color: #409eff;
  font-size: 12px;
  margin-bottom: 5px;
}

.last-active {
  color: #909399;
  font-size: 12px;
}
</style>