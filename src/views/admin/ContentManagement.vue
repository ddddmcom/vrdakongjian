<template>
  <div class="content-management">
    <div class="page-header">
      <h2>内容管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增内容
      </el-button>
    </div>

    <!-- 内容列表 -->
    <el-card>
      <el-table :data="contents" v-loading="loading" stripe>
        <el-table-column prop="title" label="内容标题" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="250" />
        <el-table-column prop="totalLevels" label="总关卡" width="100" />
        <el-table-column prop="totalDuration" label="总时长" width="100">
          <template #default="{ row }">
            {{ row.totalDuration }} 分钟
          </template>
        </el-table-column>
        <el-table-column prop="price" label="建议价格" width="120">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editContent(row)">编辑</el-button>
            <el-button size="small" type="info" @click="viewAssignments(row)">分配情况</el-button>
            <el-button size="small" type="danger" @click="deleteContent(row)">删除</el-button>
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

    <!-- 创建/编辑内容对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingContent ? '编辑内容' : '新增内容'"
      width="600px"
    >
      <el-form
        ref="contentFormRef"
        :model="contentForm"
        :rules="contentRules"
        label-width="100px"
      >
        <el-form-item label="内容标题" prop="title">
          <el-input v-model="contentForm.title" placeholder="内容标题（唯一）" />
        </el-form-item>
        
        <el-form-item label="内容描述" prop="description">
          <el-input 
            v-model="contentForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="内容描述"
          />
        </el-form-item>
        
        <el-form-item label="总关卡数" prop="totalLevels">
          <el-input-number 
            v-model="contentForm.totalLevels" 
            :min="1" 
            :max="100"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="总时长" prop="totalDuration">
          <el-input-number 
            v-model="contentForm.totalDuration" 
            :min="1" 
            :precision="0"
            style="width: 100%"
          />
          <span style="margin-left: 10px; color: #909399;">分钟</span>
        </el-form-item>
        
        <el-form-item label="建议价格" prop="price">
          <el-input-number 
            v-model="contentForm.price" 
            :min="0" 
            :precision="2"
            style="width: 100%"
          />
          <span style="margin-left: 10px; color: #909399;">元</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveContent" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分配情况对话框 -->
    <el-dialog
      v-model="showAssignmentsDialog"
      title="内容分配情况"
      width="80%"
    >
      <div v-if="selectedContent">
        <h4>{{ selectedContent.title }} - 分配情况</h4>
        
        <el-table :data="contentAssignments" v-loading="assignmentsLoading">
          <el-table-column prop="shopName" label="店铺名称" />
          <el-table-column prop="shopAddress" label="店铺地址" />
          <el-table-column prop="price" label="定价" width="100">
            <template #default="{ row }">
              ¥{{ row.price }}
            </template>
          </el-table-column>
          <el-table-column label="授权时间" width="200">
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
          <el-table-column label="播放统计" width="150">
            <template #default="{ row }">
              <div>总播放: {{ row.totalPlays || 0 }}次</div>
              <div>总收益: ¥{{ row.totalRevenue || 0 }}</div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { VRContent, ShopContentAssignment } from '@/types'
import { contentApi } from '@/api/content'

const loading = ref(false)
const saving = ref(false)
const assignmentsLoading = ref(false)

const contents = ref<VRContent[]>([])
const contentAssignments = ref<ShopContentAssignment[]>([])

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const showCreateDialog = ref(false)
const showAssignmentsDialog = ref(false)
const editingContent = ref<VRContent | null>(null)
const selectedContent = ref<VRContent | null>(null)

const contentFormRef = ref<FormInstance>()
const contentForm = reactive({
  title: '',
  description: '',
  totalLevels: 1,
  totalDuration: 60,
  price: 0
})

const contentRules = {
  title: [{ required: true, message: '请输入内容标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入内容描述', trigger: 'blur' }],
  totalLevels: [{ required: true, message: '请输入总关卡数', trigger: 'blur' }],
  totalDuration: [{ required: true, message: '请输入总时长', trigger: 'blur' }],
  price: [{ required: true, message: '请输入建议价格', trigger: 'blur' }]
}

onMounted(() => {
  loadContents()
})

const loadContents = async () => {
  loading.value = true
  try {
    const response = await contentApi.getContents(currentPage.value, pageSize.value)
    if (response.code === 200) {
      contents.value = response.data.list
      total.value = response.data.total
    }
  } catch (error) {
    ElMessage.error('加载内容列表失败')
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

const isExpired = (endTime: string) => {
  return new Date(endTime) < new Date()
}

const editContent = (content: VRContent) => {
  editingContent.value = content
  Object.assign(contentForm, content)
  showCreateDialog.value = true
}

const deleteContent = async (content: VRContent) => {
  try {
    await ElMessageBox.confirm(`确认删除内容 "${content.title}" 吗？`, '确认删除')
    
    const response = await contentApi.deleteContent(content.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadContents()
    }
  } catch (error) {
    // 用户取消操作
  }
}

const viewAssignments = async (content: VRContent) => {
  selectedContent.value = content
  showAssignmentsDialog.value = true
  
  assignmentsLoading.value = true
  try {
    // 这里应该获取内容的分配情况
    // const response = await contentApi.getContentAssignments(content.id)
    // 模拟数据
    contentAssignments.value = []
  } catch (error) {
    ElMessage.error('加载分配情况失败')
  } finally {
    assignmentsLoading.value = false
  }
}

const saveContent = async () => {
  if (!contentFormRef.value) return
  
  await contentFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    
    try {
      let response
      if (editingContent.value) {
        response = await contentApi.updateContent(editingContent.value.id, contentForm)
      } else {
        response = await contentApi.createContent(contentForm)
      }
      
      if (response.code === 200) {
        ElMessage.success(editingContent.value ? '更新成功' : '创建成功')
        showCreateDialog.value = false
        resetForm()
        loadContents()
      }
    } catch (error) {
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  })
}

const resetForm = () => {
  editingContent.value = null
  Object.assign(contentForm, {
    title: '',
    description: '',
    totalLevels: 1,
    totalDuration: 60,
    price: 0
  })
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadContents()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadContents()
}
</script>

<style scoped>
.content-management {
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