<template>
  <div class="shop-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="250px" class="sidebar">
        <div class="logo">
          <h3>店铺管理系统</h3>
          <p>{{ authStore.user?.shopName }}</p>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
        >
          <el-menu-item index="/shop/content">
            <el-icon><VideoPlay /></el-icon>
            <span>VR内容</span>
          </el-menu-item>
          
          <el-menu-item index="/shop/devices">
            <el-icon><Monitor /></el-icon>
            <span>VR设备控制</span>
          </el-menu-item>
          
          <el-menu-item index="/shop/statistics">
            <el-icon><DataAnalysis /></el-icon>
            <span>经营统计</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>店铺管理</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentPageName }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><User /></el-icon>
                {{ authStore.user?.username }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 主要内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  VideoPlay, 
  Monitor, 
  DataAnalysis, 
  User, 
  ArrowDown 
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const currentPageName = computed(() => {
  const routeMap: { [key: string]: string } = {
    '/shop/content': 'VR内容',
    '/shop/devices': 'VR设备控制',
    '/shop/statistics': '经营统计'
  }
  return routeMap[route.path] || '控制台'
})

const handleCommand = (command: string) => {
  if (command === 'logout') {
    authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.shop-layout {
  height: 100vh;
}

.sidebar {
  background-color: #2c3e50;
  color: white;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #34495e;
}

.logo h3 {
  color: white;
  margin: 0 0 5px 0;
  font-size: 18px;
}

.logo p {
  color: #bdc3c7;
  margin: 0;
  font-size: 14px;
}

.sidebar-menu {
  border: none;
  background-color: transparent;
}

.sidebar-menu .el-menu-item {
  color: #bfcbd9;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #34495e;
  color: white;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: white;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}

.user-info:hover {
  color: #409eff;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>