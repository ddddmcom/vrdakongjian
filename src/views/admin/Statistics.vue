<template>
  <div class="admin-statistics">
    <div class="page-header">
      <h2>数据统计</h2>
      <div class="date-filter">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="loadStatistics"
        />
        <el-button @click="exportData" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 概览统计 -->
    <el-row :gutter="20" class="overview-stats">
      <el-col :span="6">
        <el-card>
          <el-statistic 
            title="总播放次数" 
            :value="statistics.totalPlays" 
            suffix="次"
          >
            <template #prefix>
              <el-icon style="color: #409eff"><VideoPlay /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic 
            title="总收益" 
            :value="statistics.totalRevenue" 
            prefix="¥"
            :precision="2"
          >
            <template #prefix>
              <el-icon style="color: #67c23a"><Money /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic 
            title="有效播放率" 
            :value="validPlayRate" 
            suffix="%"
            :precision="1"
          >
            <template #prefix>
              <el-icon style="color: #e6a23c"><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic 
            title="平均播放时长" 
            :value="statistics.averagePlayTime" 
            suffix="分钟"
            :precision="1"
          >
            <template #prefix>
              <el-icon style="color: #f56c6c"><Timer /></el-icon>
            </template>
          </el-statistic>
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
            <span>热门内容排行</span>
          </template>
          <div ref="topContentChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>店铺收益排行</span>
          </template>
          <div ref="shopRevenueChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="table-header">
          <span>详细数据</span>
          <el-radio-group v-model="tableView" @change="loadTableData">
            <el-radio-button value="shop">按店铺</el-radio-button>
            <el-radio-button value="content">按内容</el-radio-button>
            <el-radio-button value="daily">按日期</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="tableLoading">
        <!-- 店铺视图 -->
        <template v-if="tableView === 'shop'">
          <el-table-column prop="shopName" label="店铺名称" />
          <el-table-column prop="totalPlays" label="播放次数" />
          <el-table-column prop="validPlays" label="有效播放" />
          <el-table-column prop="totalRevenue" label="总收益">
            <template #default="{ row }">
              ¥{{ row.totalRevenue }}
            </template>
          </el-table-column>
          <el-table-column prop="averagePlayTime" label="平均播放时长">
            <template #default="{ row }">
              {{ row.averagePlayTime }} 分钟
            </template>
          </el-table-column>
        </template>
        
        <!-- 内容视图 -->
        <template v-else-if="tableView === 'content'">
          <el-table-column prop="contentTitle" label="内容名称" />
          <el-table-column prop="totalPlays" label="播放次数" />
          <el-table-column prop="validPlays" label="有效播放" />
          <el-table-column prop="totalRevenue" label="总收益">
            <template #default="{ row }">
              ¥{{ row.totalRevenue }}
            </template>
          </el-table-column>
          <el-table-column prop="averagePlayTime" label="平均播放时长">
            <template #default="{ row }">
              {{ row.averagePlayTime }} 分钟
            </template>
          </el-table-column>
        </template>
        
        <!-- 日期视图 -->
        <template v-else>
          <el-table-column prop="date" label="日期" />
          <el-table-column prop="totalPlays" label="播放次数" />
          <el-table-column prop="validPlays" label="有效播放" />
          <el-table-column prop="totalRevenue" label="总收益">
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Download, 
  VideoPlay, 
  Money, 
  TrendCharts, 
  Timer 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { Statistics } from '@/types'

const loading = ref(false)
const tableLoading = ref(false)
const exporting = ref(false)

const dateRange = ref<[Date, Date]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
  new Date()
])

const statistics = ref<Statistics>({
  totalPlays: 0,
  totalRevenue: 0,
  validPlays: 0,
  averagePlayTime: 0,
  topContent: [],
  dailyStats: []
})

const tableView = ref('shop')
const tableData = ref<any[]>([])

// 图表实例
const playTrendChart = ref<HTMLElement>()
const revenueTrendChart = ref<HTMLElement>()
const topContentChart = ref<HTMLElement>()
const shopRevenueChart = ref<HTMLElement>()

let playChart: echarts.ECharts | null = null
let revenueChart: echarts.ECharts | null = null
let contentChart: echarts.ECharts | null = null
let shopChart: echarts.ECharts | null = null

const validPlayRate = computed(() => {
  if (statistics.value.totalPlays === 0) return 0
  return (statistics.value.validPlays / statistics.value.totalPlays) * 100
})

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
    // 这里应该调用实际的API
    // 模拟数据
    statistics.value = {
      totalPlays: 1250,
      totalRevenue: 25000,
      validPlays: 1100,
      averagePlayTime: 15.5,
      topContent: [],
      dailyStats: generateDailyStats()
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
    // 这里应该根据tableView加载不同的数据
    // 模拟数据
    if (tableView.value === 'shop') {
      tableData.value = [
        {
          shopName: '体验店A',
          totalPlays: 150,
          validPlays: 140,
          totalRevenue: 3000,
          averagePlayTime: 16.2
        }
      ]
    } else if (tableView.value === 'content') {
      tableData.value = [
        {
          contentTitle: 'VR冒险游戏',
          totalPlays: 200,
          validPlays: 180,
          totalRevenue: 4000,
          averagePlayTime: 18.5
        }
      ]
    } else {
      tableData.value = generateDailyStats().map(stat => ({
        ...stat,
        uniqueUsers: Math.floor(stat.plays * 0.8)
      }))
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
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    stats.push({
      date: date.toISOString().split('T')[0],
      plays: Math.floor(Math.random() * 50) + 10,
      validPlays: Math.floor(Math.random() * 45) + 8,
      revenue: Math.floor(Math.random() * 1000) + 200
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
  if (topContentChart.value) {
    contentChart = echarts.init(topContentChart.value)
  }
  if (shopRevenueChart.value) {
    shopChart = echarts.init(shopRevenueChart.value)
  }
  
  updateCharts()
}

const updateCharts = () => {
  // 播放趋势图
  if (playChart) {
    const dates = statistics.value.dailyStats.map(s => s.date)
    const plays = statistics.value.dailyStats.map(s => s.plays)
    const validPlays = statistics.value.dailyStats.map(s => s.validPlays)
    
    playChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['总播放', '有效播放'] },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [
        {
          name: '总播放',
          type: 'line',
          data: plays,
          smooth: true,
          itemStyle: { color: '#409eff' }
        },
        {
          name: '有效播放',
          type: 'line',
          data: validPlays,
          smooth: true,
          itemStyle: { color: '#67c23a' }
        }
      ]
    })
  }
  
  // 收益趋势图
  if (revenueChart) {
    const dates = statistics.value.dailyStats.map(s => s.date)
    const revenue = statistics.value.dailyStats.map(s => s.revenue)
    
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
  
  // 热门内容图
  if (contentChart) {
    const mockContentData = [
      { name: 'VR冒险游戏', value: 200 },
      { name: '太空探索', value: 180 },
      { name: '海底世界', value: 150 },
      { name: '恐龙时代', value: 120 },
      { name: '未来城市', value: 100 }
    ]
    
    contentChart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
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
  
  // 店铺收益图
  if (shopChart) {
    const mockShopData = [
      { name: '体验店A', value: 3000 },
      { name: '体验店B', value: 2500 },
      { name: '体验店C', value: 2000 },
      { name: '体验店D', value: 1800 },
      { name: '体验店E', value: 1500 }
    ]
    
    shopChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: mockShopData.map(item => item.name)
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: mockShopData.map(item => item.value),
        itemStyle: { color: '#e6a23c' }
      }]
    })
  }
}

const exportData = async () => {
  exporting.value = true
  try {
    // 这里应该调用导出API
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.admin-statistics {
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
  gap: 15px;
}

.overview-stats {
  margin-bottom: 20px;
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