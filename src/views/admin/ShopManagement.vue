<template>
  <div class="shop-management">
    <div class="page-header">
      <h2>店铺管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增店铺
      </el-button>
    </div>

    <!-- 店铺列表 -->
    <el-card>
      <el-table :data="shops" v-loading="loading" stripe>
        <el-table-column prop="name" label="店铺名称" min-width="120" />
        <el-table-column prop="address" label="店铺地址" min-width="200" />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="adminAccount" label="管理员账号" width="120" />
        <el-table-column label="授权状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="授权时间" width="180">
          <template #default="{ row }">
            <div>{{ formatDate(row.authStartTime) }}</div>
            <div>至 {{ formatDate(row.authEndTime) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editShop(row)">编辑</el-button>
            <el-button size="small" type="info" @click="manageContent(row)">内容管理</el-button>
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

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑店铺对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingShop ? '编辑店铺' : '新增店铺'"
      width="600px"
    >
      <el-form
        ref="shopFormRef"
        :model="shopForm"
        :rules="shopRules"
        label-width="100px"
      >
        <el-form-item label="店铺名称" prop="name">
          <el-input v-model="shopForm.name" />
        </el-form-item>
        
        <el-form-item label="店铺地址" prop="address">
          <el-input v-model="shopForm.address" />
        </el-form-item>
        
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="shopForm.contact" />
        </el-form-item>
        
        <el-form-item label="电话" prop="phone">
          <el-input v-model="shopForm.phone" />
        </el-form-item>
        
        <el-form-item label="管理员账号" prop="adminAccount">
          <el-input v-model="shopForm.adminAccount" />
        </el-form-item>
        
        <el-form-item label="管理员密码" prop="adminPassword">
          <el-input v-model="shopForm.adminPassword" type="password" />
        </el-form-item>
        
        <el-form-item label="授权时间" prop="authTime">
          <el-date-picker
            v-model="shopForm.authTime"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="分成方式">
          <el-radio-group v-model="shareType">
            <el-radio value="amount">固定金额</el-radio>
            <el-radio value="ratio">比例分成</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="shareType === 'amount'" label="分成金额">
          <el-input-number v-model="shopForm.shareAmount" :min="0" :precision="2" />
        </el-form-item>
        
        <el-form-item v-if="shareType === 'ratio'" label="分成比例">
          <el-input-number v-model="shopForm.shareRatio" :min="0" :max="100" :precision="1" />
          <span style="margin-left: 5px;">%</span>
        </el-form-item>
        
        <el-form-item label="建议定价" prop="suggestedPrice">
          <el-input-number v-model="shopForm.suggestedPrice" :min="0" :precision="2" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveShop" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 内容管理对话框 -->
    <ContentAssignmentDialog
      v-model="showContentDialog"
      :shop="selectedShop"
      @refresh="loadShops"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Shop } from '@/types'
import { shopApi } from '@/api/shop'
import ContentAssignmentDialog from '@/components/ContentAssignmentDialog.vue'

const loading = ref(false)
const saving = ref(false)
const shops = ref<Shop[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const showCreateDialog = ref(false)
const showContentDialog = ref(false)
const editingShop = ref<Shop | null>(null)
const selectedShop = ref<Shop | null>(null)
const shareType = ref('amount')

const shopFormRef = ref<FormInstance>()
const shopForm = reactive({
  name: '',
  address: '',
  contact: '',
  phone: '',
  adminAccount: '',
  adminPassword: '',
  authTime: [] as Date[],
  shareAmount: 0,
  shareRatio: 0,
  suggestedPrice: 0
})

const shopRules = {
  name: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入店铺地址', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
  adminAccount: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  adminPassword: [{ required: true, message: '请输入管理员密码', trigger: 'blur' }],
  authTime: [{ required: true, message: '请选择授权时间', trigger: 'change' }],
  suggestedPrice: [{ required: true, message: '请输入建议定价', trigger: 'blur' }]
}

onMounted(() => {
  loadShops()
})

const loadShops = async () => {
  loading.value = true
  try {
    const response = await shopApi.getShops(currentPage.value, pageSize.value)
    if (response.code === 200) {
      shops.value = response.data.list
      total.value = response.data.total
    }
  } catch (error) {
    ElMessage.error('加载店铺列表失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

const editShop = (shop: Shop) => {
  editingShop.value = shop
  Object.assign(shopForm, {
    ...shop,
    authTime: [new Date(shop.authStartTime), new Date(shop.authEndTime)]
  })
  shareType.value = shop.shareAmount ? 'amount' : 'ratio'
  showCreateDialog.value = true
}

const manageContent = (shop: Shop) => {
  selectedShop.value = shop
  showContentDialog.value = true
}

const toggleShopStatus = async (shop: Shop) => {
  const newStatus = shop.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '停用'
  
  try {
    await ElMessageBox.confirm(`确认${action}店铺 "${shop.name}" 吗？`, '确认操作')
    
    const response = await shopApi.updateShop(shop.id, { status: newStatus })
    if (response.code === 200) {
      ElMessage.success(`${action}成功`)
      loadShops()
    }
  } catch (error) {
    // 用户取消操作
  }
}

const saveShop = async () => {
  if (!shopFormRef.value) return
  
  await shopFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    
    try {
      const shopData = {
        ...shopForm,
        authStartTime: shopForm.authTime[0].toISOString(),
        authEndTime: shopForm.authTime[1].toISOString(),
        shareAmount: shareType.value === 'amount' ? shopForm.shareAmount : undefined,
        shareRatio: shareType.value === 'ratio' ? shopForm.shareRatio : undefined,
        status: 'active' as const
      }
      
      let response
      if (editingShop.value) {
        response = await shopApi.updateShop(editingShop.value.id, shopData)
      } else {
        response = await shopApi.createShop(shopData)
      }
      
      if (response.code === 200) {
        ElMessage.success(editingShop.value ? '更新成功' : '创建成功')
        showCreateDialog.value = false
        resetForm()
        loadShops()
      }
    } catch (error) {
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  })
}

const resetForm = () => {
  editingShop.value = null
  Object.assign(shopForm, {
    name: '',
    address: '',
    contact: '',
    phone: '',
    adminAccount: '',
    adminPassword: '',
    authTime: [],
    shareAmount: 0,
    shareRatio: 0,
    suggestedPrice: 0
  })
  shareType.value = 'amount'
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadShops()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadShops()
}
</script>

<style scoped>
.shop-management {
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>