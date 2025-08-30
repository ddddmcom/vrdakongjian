<template>
  <div class="shop-content">
    <div class="page-header">
      <h2>VR内容管理</h2>
      <div class="content-stats">
        <el-statistic title="已授权内容" :value="authorizedCount" />
        <el-statistic title="即将过期" :value="expiringSoonCount" />
      </div>
    </div>

    <!-- 内容列表 -->
    <div class="content-grid">
      <el-card 
        v-for="assignment in contentAssignments" 
        :key="assignment.id" 
        class="content-card"
        :class="{'expired': isExpired(assignment.authEndTime)}"
      >
        <template #header>
          <div class="content-header">
            <span class="content-title">{{ assignment.content.title }}</span>
            <el-tag 
              :type="isExpired(assignment.authEndTime) ? 'danger' : 'success'"
            >
              {{ isExpired(assignment.authEndTime) ? '已过期' : '正常' }}
            </el-tag>
          </div>
        </template>

        <div class="content-body">
          <div class="content-info">
            <p><strong>定价:</strong> ¥{{ assignment.price }}</p>
            <p><strong>总关卡:</strong> {{ assignment.content.totalLevels }}</p>
            <p><strong>总时长:</strong> {{ assignment.content.totalDuration }} 分钟</p>
            <p><strong>授权时间:</strong></p>
            <p class="auth-time">
              {{ formatDateTime(assignment.authStartTime) }}<br>
              至 {{ formatDateTime(assignment.authEndTime) }}
            </p>
          </div>

          <!-- 播放统计 -->
          <div class="play-stats">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-statistic 
                  title="今日播放" 
                  :value="getTodayPlays(assignment.contentId)" 
                  suffix="次"
                />
              </el-col>
              <el-col :span="8">
                <el-statistic 
                  title="今日收益" 
                  :value="getTodayRevenue(assignment.contentId)" 
                  prefix="¥"
                  :precision="2"
                />
              </el-col>
              <el-col :span="8">
                <el-statistic 
                  title="总播放" 
                  :value="getTotalPlays(assignment.contentId)" 
                  suffix="次"
                />
              </el-col>
            </el-row>
          </div>

          <!-- 操作按钮 -->
          <div class="content-actions" v-if="!isExpired(assignment.authEndTime)">
            <el-button 
              type="primary" 
              size="small"
              @click="viewPlayRecords(assignment.contentId)"
            >
              播放记录
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 播放记录对话框 -->
    <el-dialog
      v-model="showRecordsDialog"
      title="播放记录"
      width="80%"
      top="5vh"
    >
      <div v-if="selectedContentId">
        <el-table :data="playRecords" v-loading="recordsLoading">
          <el-table-column prop="deviceCode" label="设备" width="100" />
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
          <el-table-column prop="currentLevel" label="播放关卡" width="120">
            <template #default="{ row }">
              {{ row.currentLevel }}/{{ row.totalLevels }}
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="播放时长" width="120">
            <template #default="{ row }">
              {{ calculateDuration(row.startTime, row.endTime) }}
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

        <div class="pagination" style="margin-top: 20px;">
          <el-pagination
            v-model:current-page="recordsPage"
            v-model:page-size="recordsPageSize"
            :total="recordsTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadPlayRecords"
            @current-change="loadPlayRecords"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { ShopContentAssignment, PlayRecord } from '@/types'
import { shopApi } from '@/api/shop'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const contentAssignments = ref<ShopContentAssignment[]>([])
const playRecords = ref<PlayRecord[]>([])
const playStats = ref<{ [contentId: number]: any }>({})

const loading = ref(false)
const recordsLoading = ref(false)
const showRecordsDialog = ref(false)
const selectedContentId = ref<number | null>(null)

const recordsPage = ref(1)
const recordsPageSize = ref(10)
const recordsTotal = ref(0)

const authorizedCount = computed(() => contentAssignments.value.length)

const expiringSoonCount = computed(() => {
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return contentAssignments.value.filter(assignment => {
    const endTime = new Date(assignment.authEndTime)
    return endTime > now && endTime <= sevenDaysLater
  }).length
})

onMounted(() => {
  loadContentAssignments()
  loadPlayStats()
})

const loadContentAssignments = async () => {
  if (!authStore.user?.shopId) return
  
  loading.value = true
  try {
    const response = await shopApi.getShopContent(authStore.user.shopId)
    if (response.code === 200) {
      contentAssignments.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载内容列表失败')
  } finally {
    loading.value = false
  }
}

const loadPlayStats = async () => {
  // 这里应该加载播放统计数据
  // 模拟数据
  playStats.value = {}
}

const loadPlayRecords = async () => {
  if (!selectedContentId.value) return
  
  recordsLoading.value = true
  try {
    // 这里应该根据内容ID加载播放记录
    // const response = await recordApi.getContentPlayRecords(
    //   selectedContentId.value, 
    //   recordsPage.value, 
    //   recordsPageSize.value
    // )
    // 模拟数据
    playRecords.value = []
    recordsTotal.value = 0
  } catch (error) {
    ElMessage.error('加载播放记录失败')
  } finally {
    recordsLoading.value = false
  }
}

const isExpired = (endTime: string) => {
  return new Date(endTime) < new Date()
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const getTodayPlays = (contentId: number) => {
  return playStats.value[contentId]?.todayPlays || 0
}

const getTodayRevenue = (contentId: number) => {
  return playStats.value[contentId]?.todayRevenue || 0
}

const getTotalPlays = (contentId: number) => {
  return playStats.value[contentId]?.totalPlays || 0
}

const calculateDuration = (startTime: string, endTime?: string) => {
  if (!endTime) return '播放中'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)
  
  return `${diff} 分钟`
}

const viewPlayRecords = (contentId: number) => {
  selectedContentId.value = contentId
  recordsPage.value = 1
  showRecordsDialog.value = true
  loadPlayRecords()
}
</script>

<style scoped>
.shop-content {
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

.content-stats {
  display: flex;
  gap: 40px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.content-card {
  transition: all 0.3s ease;
}

.content-card.expired {
  opacity: 0.6;
  border-color: #f56c6c;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.content-info p {
  margin: 8px 0;
  color: #606266;
}

.auth-time {
  font-size: 12px;
  color: #909399;
}

.play-stats {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.content-actions {
  text-align: center;
  margin-top: 15px;
}

.pagination {
  display: flex;
  justify-content: center;
}
</style>