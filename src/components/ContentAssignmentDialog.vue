<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="内容分配管理"
    width="800px"
    top="5vh"
  >
    <div v-if="shop">
      <h4>{{ shop.name }} - 内容分配</h4>
      
      <!-- 已分配内容列表 -->
      <el-card class="assigned-content">
        <template #header>
          <div class="card-header">
            <span>已分配内容</span>
            <el-button type="primary" size="small" @click="showAssignDialog = true">
              <el-icon><Plus /></el-icon>
              分配内容
            </el-button>
          </div>
        </template>
        
        <el-table :data="assignedContent" v-loading="loading">
          <el-table-column prop="content.title" label="内容标题" />
          <el-table-column prop="price" label="定价" width="100">
            <template #default="{ row }">
              ¥{{ row.price }}
            </template>
          </el-table-column>
          <el-table-column label="授权时间" width="180">
            <template #default="{ row }">
              <div>{{ formatDate(row.authStartTime) }}</div>
              <div>至 {{ formatDate(row.authEndTime) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="isExpired(row.authEndTime) ? 'danger' : 'success'">
                {{ isExpired(row.authEndTime) ? '已过期' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="removeAssignment(row)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- VR设备列表 -->
      <el-card class="devices-section" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>VR设备</span>
            <el-button type="primary" size="small" @click="showDeviceDialog = true">
              <el-icon><Plus /></el-icon>
              添加设备
            </el-button>
          </div>
        </template>
        
        <el-table :data="devices" v-loading="devicesLoading">
          <el-table-column prop="deviceCode" label="设备编号" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getDeviceStatusType(row.status)">
                {{ getDeviceStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="currentContent.title" label="当前内容" />
          <el-table-column prop="lastActiveTime" label="最后活跃时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.lastActiveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="removeDevice(row)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 分配内容对话框 -->
    <el-dialog
      v-model="showAssignDialog"
      title="分配内容"
      width="500px"
      append-to-body
    >
      <el-form ref="assignFormRef" :model="assignForm" :rules="assignRules" label-width="100px">
        <el-form-item label="选择内容" prop="contentId">
          <el-select v-model="assignForm.contentId" placeholder="请选择内容" style="width: 100%">
            <el-option
              v-for="content in availableContent"
              :key="content.id"
              :label="content.title"
              :value="content.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="授权时间" prop="authTime">
          <el-date-picker
            v-model="assignForm.authTime"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="定价" prop="price">
          <el-input-number v-model="assignForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="assignContent" :loading="assigning">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加设备对话框 -->
    <el-dialog
      v-model="showDeviceDialog"
      title="添加VR设备"
      width="400px"
      append-to-body
    >
      <el-form ref="deviceFormRef" :model="deviceForm" :rules="deviceRules" label-width="100px">
        <el-form-item label="设备编号" prop="deviceCode">
          <el-input v-model="deviceForm.deviceCode" placeholder="如: A001, B002" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showDeviceDialog = false">取消</el-button>
        <el-button type="primary" @click="addDevice" :loading="addingDevice">添加</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Shop, VRContent, ShopContentAssignment, VRDevice } from '@/types'
import { shopApi } from '@/api/shop'
import { contentApi } from '@/api/content'
import { deviceApi } from '@/api/device'

interface Props {
  modelValue: boolean
  shop: Shop | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  refresh: []
}>()

const loading = ref(false)
const devicesLoading = ref(false)
const assigning = ref(false)
const addingDevice = ref(false)

const assignedContent = ref<ShopContentAssignment[]>([])
const availableContent = ref<VRContent[]>([])
const devices = ref<VRDevice[]>([])

const showAssignDialog = ref(false)
const showDeviceDialog = ref(false)

const assignFormRef = ref<FormInstance>()
const deviceFormRef = ref<FormInstance>()

const assignForm = reactive({
  contentId: null as number | null,
  authTime: [] as Date[],
  price: 0
})

const deviceForm = reactive({
  deviceCode: ''
})

const assignRules = {
  contentId: [{ required: true, message: '请选择内容', trigger: 'change' }],
  authTime: [{ required: true, message: '请选择授权时间', trigger: 'change' }],
  price: [{ required: true, message: '请输入定价', trigger: 'blur' }]
}

const deviceRules = {
  deviceCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }]
}

watch(() => props.modelValue, (val) => {
  if (val && props.shop) {
    loadAssignedContent()
    loadAvailableContent()
    loadDevices()
  }
})

const loadAssignedContent = async () => {
  if (!props.shop) return
  
  loading.value = true
  try {
    const response = await shopApi.getShopContent(props.shop.id)
    if (response.code === 200) {
      assignedContent.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载已分配内容失败')
  } finally {
    loading.value = false
  }
}

const loadAvailableContent = async () => {
  try {
    const response = await contentApi.getContents()
    if (response.code === 200) {
      availableContent.value = response.data.list
    }
  } catch (error) {
    ElMessage.error('加载可用内容失败')
  }
}

const loadDevices = async () => {
  if (!props.shop) return
  
  devicesLoading.value = true
  try {
    const response = await deviceApi.getShopDevices(props.shop.id)
    if (response.code === 200) {
      devices.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载设备列表失败')
  } finally {
    devicesLoading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const isExpired = (endTime: string) => {
  return new Date(endTime) < new Date()
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

const assignContent = async () => {
  if (!assignFormRef.value || !props.shop) return
  
  await assignFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    assigning.value = true
    try {
      const response = await shopApi.assignContent(
        props.shop!.id,
        assignForm.contentId!,
        {
          authStartTime: assignForm.authTime[0].toISOString(),
          authEndTime: assignForm.authTime[1].toISOString(),
          price: assignForm.price
        }
      )
      
      if (response.code === 200) {
        ElMessage.success('分配成功')
        showAssignDialog.value = false
        resetAssignForm()
        loadAssignedContent()
      }
    } catch (error) {
      ElMessage.error('分配失败')
    } finally {
      assigning.value = false
    }
  })
}

const removeAssignment = async (assignment: ShopContentAssignment) => {
  try {
    await ElMessageBox.confirm('确认移除此内容分配吗？', '确认操作')
    
    const response = await shopApi.removeShopContent(assignment.shopId, assignment.contentId)
    if (response.code === 200) {
      ElMessage.success('移除成功')
      loadAssignedContent()
    }
  } catch (error) {
    // 用户取消操作
  }
}

const addDevice = async () => {
  if (!deviceFormRef.value || !props.shop) return
  
  await deviceFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    addingDevice.value = true
    try {
      const response = await deviceApi.createDevice({
        deviceCode: deviceForm.deviceCode,
        shopId: props.shop!.id
      })
      
      if (response.code === 200) {
        ElMessage.success('添加成功')
        showDeviceDialog.value = false
        resetDeviceForm()
        loadDevices()
      }
    } catch (error) {
      ElMessage.error('添加失败')
    } finally {
      addingDevice.value = false
    }
  })
}

const removeDevice = async (device: VRDevice) => {
  try {
    await ElMessageBox.confirm(`确认移除设备 "${device.deviceCode}" 吗？`, '确认操作')
    
    const response = await deviceApi.deleteDevice(device.id)
    if (response.code === 200) {
      ElMessage.success('移除成功')
      loadDevices()
    }
  } catch (error) {
    // 用户取消操作
  }
}

const resetAssignForm = () => {
  Object.assign(assignForm, {
    contentId: null,
    authTime: [],
    price: 0
  })
}

const resetDeviceForm = () => {
  Object.assign(deviceForm, {
    deviceCode: ''
  })
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assigned-content {
  margin-bottom: 20px;
}
</style>