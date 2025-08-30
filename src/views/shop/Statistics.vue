<template>
  <div class="shop-statistics">
    <div class="page-header">
      <h2>经营统计</h2>
      <div class="date-filter">
        <el-radio-group v-model="timeRange" @change="loadStatistics">
          <el-radio-button value="today">今日</el-radio-button>
          <el-radio-button value="week">本周</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
          <el-radio-button value="year">本年</el-radio-button>
        </el-radio-group>
        
        <el-date-picker
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="loadStatistics"
          style="margin-left: 15px;"
        />
      </div>
    </div>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-overview">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" style="color: #409eff"><VideoPlay /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ shopStats.totalPlays }}</div>
              <div class="stat-label">播放次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" style="color: #67c23a"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ shopStats.totalRevenue }}</div>
              <div class="stat-label">销售金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" style="color: #e6a23c"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ shopStats.uniqueUsers }}</div>
              <div class="stat-label">使用人数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" style="color: #f56c6c"><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ shopStats.averagePlayTime }}分</div>
              <div class="stat-label">平均时长</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>播放趋势</span>
          </template>
          <div ref="playTrendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>收益趋势</span>
          </template>
          <div ref="revenueTrendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>内容播放排行</span>
          </template>
          <div ref="contentRankChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>设备使用情况</span>
          </template>
          <div ref="deviceUsageChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="table-header">
          <span>详细数据</span>
          <el-radio-group v-model="tableView" @change="loadTableData">
            <el-radio-button value="content">按内容</el-radio-button>
            <el-radio-button value="device">按设备</el-radio-button>
            <el-radio-button value="daily">按日期</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="tableLoading">
        <!-- 内容视图 -->
        <template v-if="tableView === 'content'">
          <el-table-column prop="contentTitle" label="内容名称" />
          <el-table-column prop="totalPlays" label="播放次数" />
          <el-table-column prop="validPlays" label="有效播放" />
          <el-table-column prop="totalRevenue" label="收益">
            <template #default="{ row }">
              ¥{{ row.totalRevenue }}
            </template>
          </el-table-column>
          <el-table-column prop="averagePlayTime" label="平均时长">
            <template #default="{ row }">
              {{ row.averagePlayTime }} 分钟
            </template>
          </el-table-column>
        </template>
        
        <!-- 设备视图 -->
        <template v-else-if="tableView === 'device'">
          <el-table-column prop="deviceCode" label="设备编号" />
          <el-table-column prop="totalPlays" label="播放次数" />
          <el-table-column prop="totalRevenue" label="收益">
            <template #default="{ row }">
              ¥{{ row.totalRevenue }}
            </template>
          </el-table-column>
          <el-table-column prop="utilizationRate" label="使用率">
            <template #default="{ row }">
              {{ row.utilizationRate }}%
            </template>
          </el-table-column>
          <el-table-column prop="lastUsed" label="最后使用">
            <template #default="{ row }">
              {{ formatDateTime(row.lastUsed) }}
            </template>
          </el-table-column>
        </template>
        
        <!-- 日期视图 -->
        <template v-else>
          <el-table-column prop="date" label="日期" />
          <el-table-column prop="totalPlays" label="播放次数" />
          <el-table-column prop="validPlays" label="有效播放" />
          <el-table-column prop="totalRevenue" label="收益">
            <template #default="{ row }">
              ¥{{ row.totalRevenue }}
            </template>
          </el-table-column>
          <el-table-column prop="uniqueUsers" label="使用人数" />
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  VideoPlay, 
  Money, 
  User, 
  Timer 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const tableLoading = ref(false)

const timeRange = ref('today')
const customDateRange = ref<[Date, Date]>()

const shopStats = ref({
  totalPlays: 0,
  totalRevenue: 0,
  uniqueUsers: 0,
  averagePlayTime: 0
})

const tableView = ref('content')
const tableData = ref<any[]>([])

// 图表元素引用
const playTrendChart = ref<HTMLElement>()
const revenueTrendChart = ref<HTMLElement>()
const contentRankChart = ref<HTMLElement>()
const deviceUsageChart = ref<HTMLElement>()

let playChart: echarts.ECharts | null = null
let revenueChart: echarts.ECharts | null = null
let contentChart: echarts.ECharts | null = null
let deviceChart: echarts.ECharts | null = null

onMounted(() => {
  loadStatistics()
  loadTableData()
  nextTick(() => {
    initCharts()
  })
})

const loadStatistics = async () => {
  loading.value = true
  try {
    // 这里应该调用实际的API获取店铺统计数据
    // 模拟数据
    shopStats.value = {
      totalPlays: 45,
      totalRevenue: 900,
      uniqueUsers: 38,
      averagePlayTime: 16.5
    }
    
    updateCharts()
  } catch (error) {
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const loadTableData = async () => {
  tableLoading.value = true
  try {
    // 根据tableView加载不同的数据
    if (tableView.value === 'content') {
      tableData.value = [
        {
          contentTitle: 'VR冒险游戏',
          totalPlays: 20,
          validPlays: 18,
          totalRevenue: 400,
          averagePlayTime: 18.5
        }
      ]
    } else if (tableView.value === 'device') {
      tableData.value = [
        {
          deviceCode: 'A001',
          totalPlays: 15,
          totalRevenue: 300,
          utilizationRate: 75,
          lastUsed: new Date().toISOString()
        }
      ]
    } else {
      tableData.value = generateDailyStats()
    }
  } catch (error) {
    ElMessage.error('加载表格数据失败')
  } finally {
    tableLoading.value = false
  }
}

const generateDailyStats = () => {
  const stats = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    stats.push({
      date: date.toISOString().split('T')[0],
      totalPlays: Math.floor(Math.random() * 10) + 2,
      validPlays: Math.floor(Math.random() * 8) + 2,
      totalRevenue: Math.floor(Math.random() * 200) + 50,
      uniqueUsers: Math.floor(Math.random() * 8) + 2
    })
  }
  
  return stats
}

const initCharts = () => {
  if (playTrendChart.value) {
    playChart = echarts.init(playTrendChart.value)
  }
  if (revenueTrendChart.value) {
    revenueChart = echarts.init(revenueTrendChart.value)
  }
  if (contentRankChart.value) {
    contentChart = echarts.init(contentRankChart.value)
  }
  if (deviceUsageChart.value) {
    deviceChart = echarts.init(deviceUsageChart.value)
  }
  
  updateCharts()
}

const updateCharts = () => {
  const dailyStats = generateDailyStats()
  
  // 播放趋势图
  if (playChart) {
    const dates = dailyStats.map(s => s.date.split('-').slice(1).join('/'))
    const plays = dailyStats.map(s => s.totalPlays)
    
    playChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [{
        type: 'line',
        data: plays,
        smooth: true,
        itemStyle: { color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.1)' }
      }]
    })
  }
  
  // 收益趋势图
  if (revenueChart) {
    const dates = dailyStats.map(s => s.date.split('-').slice(1).join('/'))
    const revenue = dailyStats.map(s => s.totalRevenue)
    
    revenueChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: revenue,
        itemStyle: { color: '#67c23a' }
      }]
    })
  }
  
  // 内容排行图
  if (contentChart) {
    const mockContentData = [
      { name: 'VR冒险游戏', value: 20 },
      { name: '太空探索', value: 15 },
      { name: '海底世界', value: 10 }
    ]
    
    contentChart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: mockContentData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }
  
  // 设备使用情况图
  if (deviceChart) {
    const mockDeviceData = [
      { name: 'A001', value: 15 },
      { name: 'A002', value: 12 },
      { name: 'A003', value: 8 }
    ]
    
    deviceChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: mockDeviceData.map(item => item.name)
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: mockDeviceData.map(item => item.value),
        itemStyle: { color: '#e6a23c' }
      }]
    })
  }
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}
</script>

<style scoped>
.shop-statistics {
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

.date-filter {
  display: flex;
  align-items: center;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.charts-section {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>