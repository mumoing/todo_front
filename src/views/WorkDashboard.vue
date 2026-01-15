<template>
  <div class="work-dashboard">
    <div class="inprogress-section">
      <div class="section-header">
        <span class="section-title">进行中</span>
        <div class="sort-buttons">
          <el-tooltip content="按截止日期排序" placement="top">
            <el-button
              :type="sortBy === 'deadline' ? 'primary' : 'default'"
              size="small"
              @click="setSortBy('deadline')"
              :icon="sortBy === 'deadline' ? (sortAsc ? SortUp : SortDown) : SortUp"
              circle
            />
          </el-tooltip>
          <el-tooltip content="按预计完成时间排序" placement="top">
            <el-button
              :type="sortBy === 'expected' ? 'primary' : 'default'"
              size="small"
              @click="setSortBy('expected')"
              :icon="sortBy === 'expected' ? (sortAsc ? SortUp : SortDown) : SortUp"
              circle
            />
          </el-tooltip>
        </div>
      </div>

      <div class="task-list inprogress-list">
        <div
          v-for="task in sortedInProgressTasks"
          :key="task.id"
          class="task-row"
        >
          <el-checkbox
            :model-value="task.status === 'done'"
            @change="(val: boolean) => toggleTaskStatus(task, val)"
            class="task-checkbox"
          />
          <input
            v-if="editingTaskId === task.id"
            v-model="editingTitle"
            @blur="saveTaskTitle(task)"
            @keyup.enter="saveTaskTitle(task)"
            @keyup.esc="cancelEdit"
            class="task-title-input"
            ref="titleInputRef"
          />
          <span
            v-else
            class="task-title"
            @click="startEditTask(task)"
          >
            {{ task.title }}
          </span>
          <span class="task-meta">
            <span v-if="task.expected_completion_date" class="meta-item expected-meta">
              预计: {{ formatSmartDate(task.expected_completion_date) }}
            </span>
            <span v-if="task.deadline" class="meta-item deadline-meta">
              截止: {{ formatSmartDate(task.deadline) }}
            </span>
          </span>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            class="delete-btn"
            @click="deleteTask(task)"
          />
        </div>

        <div class="add-task-section">
          <div class="add-task-row" @click="focusNewTask">
            <span class="add-icon">+</span>
            <input
              v-model="newTaskTitle"
              @keyup.enter="showAddTaskDialog"
              placeholder="添加新任务（回车设置详情）..."
              class="new-task-input"
              ref="newTaskInputRef"
            />
          </div>

          <div v-if="showNewTaskDetails" class="new-task-details">
            <div class="detail-row">
              <span class="detail-label">预计完成:</span>
              <el-date-picker
                v-model="newTaskExpected"
                type="datetime"
                placeholder="选择预计完成时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ssZ"
                size="small"
                :shortcuts="dateShortcuts"
                class="detail-picker"
              />
            </div>
            <div class="detail-row">
              <span class="detail-label">截止日期:</span>
              <el-date-picker
                v-model="newTaskDeadline"
                type="datetime"
                placeholder="选择截止日期时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ssZ"
                size="small"
                :shortcuts="dateShortcuts"
                class="detail-picker"
              />
            </div>
            <div class="detail-actions">
              <el-button size="small" @click="cancelAddTask">取消</el-button>
              <el-button type="primary" size="small" @click="createTask">创建任务</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="completed-sections">
      <div class="completed-section">
        <div class="section-header clickable" @click="showWeek1 = !showWeek1">
          <div class="header-left">
            <el-icon class="collapse-icon">
              <ArrowDown v-if="showWeek1" />
              <ArrowRight v-else />
            </el-icon>
            <el-date-picker
              v-model="week1Range"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYYMMDD"
              value-format="YYYY-MM-DD"
              size="small"
              @change="loadWeek1Tasks"
              @click.stop
              class="date-range-picker"
            />
          </div>
        </div>
        <div class="task-list completed-list" v-show="showWeek1">
          <div
            v-for="task in week1Tasks"
            :key="task.id"
            class="task-row completed"
          >
            <el-checkbox
              :model-value="task.status === 'done'"
              @change="(val: boolean) => toggleTaskStatus(task, val)"
              class="task-checkbox"
            />
            <input
              v-if="editingTaskId === task.id"
              v-model="editingTitle"
              @blur="saveTaskTitle(task)"
              @keyup.enter="saveTaskTitle(task)"
              @keyup.esc="cancelEdit"
              class="task-title-input"
              ref="titleInputRef"
            />
            <span
              v-else
              class="task-title done"
              @click="startEditTask(task)"
            >
              {{ task.title }}
            </span>
          </div>
          <div v-if="week1Tasks.length === 0" class="empty-hint">
            暂无已完成任务
          </div>
        </div>
      </div>

      <div class="completed-section">
        <div class="section-header clickable" @click="showWeek2 = !showWeek2">
           <div class="header-left">
            <el-icon class="collapse-icon">
              <ArrowDown v-if="showWeek2" />
              <ArrowRight v-else />
            </el-icon>
            <el-date-picker
              v-model="week2Range"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYYMMDD"
              value-format="YYYY-MM-DD"
              size="small"
              @change="loadWeek2Tasks"
              @click.stop
              class="date-range-picker"
            />
          </div>
        </div>
        <div class="task-list completed-list" v-show="showWeek2">
          <div
            v-for="task in week2Tasks"
            :key="task.id"
            class="task-row completed"
          >
            <el-checkbox
              :model-value="task.status === 'done'"
              @change="(val: boolean) => toggleTaskStatus(task, val)"
              class="task-checkbox"
            />
            <input
              v-if="editingTaskId === task.id"
              v-model="editingTitle"
              @blur="saveTaskTitle(task)"
              @keyup.enter="saveTaskTitle(task)"
              @keyup.esc="cancelEdit"
              class="task-title-input"
              ref="titleInputRef"
            />
            <span
              v-else
              class="task-title done"
              @click="startEditTask(task)"
            >
              {{ task.title }}
            </span>
          </div>
          <div v-if="week2Tasks.length === 0" class="empty-hint">
            暂无已完成任务
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
// 添加 ArrowRight, ArrowDown
import { SortUp, SortDown, Delete, ArrowRight, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/client'
import dayjs from 'dayjs'
import type { Task } from '../api/types'

// 日期范围
const week1Range = ref<[string, string] | null>(null)
const week2Range = ref<[string, string] | null>(null)

// 2. 列表折叠状态：本周默认展开，上周默认关闭
const showWeek1 = ref(true)
const showWeek2 = ref(false)

// 任务数据
const week1Tasks = ref<Task[]>([])
const week2Tasks = ref<Task[]>([])
const inProgressTasks = ref<Task[]>([])

// 编辑状态
const editingTaskId = ref<number | null>(null)
const editingTitle = ref('')
const titleInputRef = ref<HTMLInputElement[]>()

// 新任务
const newTaskTitle = ref('')
const newTaskDeadline = ref<string | null>(null)
const newTaskExpected = ref<string | null>(null)
const showNewTaskDetails = ref(false)
const newTaskInputRef = ref<HTMLInputElement>()

// 排序
const sortBy = ref<'deadline' | 'expected'>('deadline')
const sortAsc = ref(true)

// 日期快捷选项
const dateShortcuts = [
  {
    text: '今天',
    value: () => dayjs().hour(18).minute(0).second(0).toDate()
  },
  {
    text: '明天',
    value: () => dayjs().add(1, 'day').hour(18).minute(0).second(0).toDate()
  },
  {
    text: '本周五',
    value: () => {
      const now = dayjs()
      const friday = now.day(5)
      return friday.isBefore(now, 'day') ? friday.add(1, 'week').hour(18).minute(0).second(0).toDate() : friday.hour(18).minute(0).second(0).toDate()
    }
  },
  {
    text: '下周一',
    value: () => dayjs().day(8).hour(18).minute(0).second(0).toDate()
  },
  {
    text: '下周二',
    value: () => dayjs().day(9).hour(18).minute(0).second(0).toDate()
  },
  {
    text: '下周三',
    value: () => dayjs().day(10).hour(18).minute(0).second(0).toDate()
  },
  {
    text: '下周四',
    value: () => dayjs().day(11).hour(18).minute(0).second(0).toDate()
  },
  {
    text: '下周五',
    value: () => dayjs().day(12).hour(18).minute(0).second(0).toDate()
  }
]

// 初始化日期范围（本周和上周，周一到周五）
const initDateRanges = () => {
  const now = dayjs()
  let thisWeekStart = now.startOf('week').add(1, 'day')
  if (now.day() === 0) {
    thisWeekStart = now.subtract(6, 'day')
  }
  const thisWeekEnd = thisWeekStart.add(4, 'day')

  const lastWeekStart = thisWeekStart.subtract(7, 'day')
  const lastWeekEnd = lastWeekStart.add(4, 'day')

  week1Range.value = [thisWeekStart.format('YYYY-MM-DD'), thisWeekEnd.format('YYYY-MM-DD')]
  week2Range.value = [lastWeekStart.format('YYYY-MM-DD'), lastWeekEnd.format('YYYY-MM-DD')]
}

// 智能格式化日期
const formatSmartDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = dayjs(dateStr)
  const hasTime = date.hour() !== 0 || date.minute() !== 0
  if (hasTime) {
    return date.format('MM-DD HH:mm')
  }
  return date.format('MM-DD')
}

// 加载指定日期范围的已完成任务
const loadTasksByRange = async (range: [string, string] | null): Promise<Task[]> => {
  if (!range) return []
  try {
    const [start, end] = range
    const res: any = await api.get('/tasks/all', {
      params: {
        status: 'done'
      }
    })
    const allDoneTasks: Task[] = res.data || []

    const startDate = dayjs(start).startOf('day')
    const endDate = dayjs(end).endOf('day')

    return allDoneTasks.filter((task: Task) => {
      if (!task.completed_at) return false
      const completedAt = dayjs(task.completed_at)
      return (completedAt.isAfter(startDate) || completedAt.isSame(startDate)) &&
             (completedAt.isBefore(endDate) || completedAt.isSame(endDate))
    })
  } catch (error) {
    console.error('加载任务失败:', error)
    return []
  }
}

const loadWeek1Tasks = async () => {
  week1Tasks.value = await loadTasksByRange(week1Range.value)
}

const loadWeek2Tasks = async () => {
  week2Tasks.value = await loadTasksByRange(week2Range.value)
}

const loadInProgressTasks = async () => {
  try {
    const res: any = await api.get('/tasks', { params: { status: 'todo' } })
    inProgressTasks.value = res.data || []
  } catch (error) {
    console.error('加载进行中任务失败:', error)
  }
}

const sortedInProgressTasks = computed(() => {
  const tasks = [...inProgressTasks.value]
  return tasks.sort((a, b) => {
    const field = sortBy.value === 'deadline' ? 'deadline' : 'expected_completion_date'
    const aVal = a[field] ? new Date(a[field]!).getTime() : Infinity
    const bVal = b[field] ? new Date(b[field]!).getTime() : Infinity
    return sortAsc.value ? aVal - bVal : bVal - aVal
  })
})

const setSortBy = (field: 'deadline' | 'expected') => {
  if (sortBy.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortBy.value = field
    sortAsc.value = true
  }
}

const startEditTask = (task: Task) => {
  editingTaskId.value = task.id
  editingTitle.value = task.title
  nextTick(() => {
    const inputs = titleInputRef.value
    if (inputs && inputs.length > 0) {
      const input = inputs[0]
      if (input) {
        input.focus()
        input.select()
      }
    }
  })
}

const saveTaskTitle = async (task: Task) => {
  if (!editingTitle.value.trim()) {
    ElMessage.warning('标题不能为空')
    editingTitle.value = task.title
    editingTaskId.value = null
    return
  }

  if (editingTitle.value === task.title) {
    editingTaskId.value = null
    return
  }

  try {
    await api.put(`/tasks/${task.id}`, {
      title: editingTitle.value,
      content: task.content,
      status: task.status,
      priority: task.priority,
      expected_completion_date: task.expected_completion_date || null,
      deadline: task.deadline || null
    })
    task.title = editingTitle.value
    editingTaskId.value = null
    ElMessage.success('已保存')
  } catch (error) {
    ElMessage.error('保存失败')
    editingTaskId.value = null
  }
}

const cancelEdit = () => {
  editingTaskId.value = null
  editingTitle.value = ''
}

const toggleTaskStatus = async (task: Task, completed: boolean) => {
  const newStatus = completed ? 'done' : 'todo'
  try {
    await api.put(`/tasks/${task.id}`, {
      title: task.title,
      content: task.content,
      status: newStatus,
      priority: task.priority,
      expected_completion_date: task.expected_completion_date || null,
      deadline: task.deadline || null
    })
    await Promise.all([loadWeek1Tasks(), loadWeek2Tasks(), loadInProgressTasks()])
    ElMessage.success(completed ? '已标记为完成' : '已标记为进行中')
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const deleteTask = async (task: Task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${task.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await api.delete(`/tasks/${task.id}`)
    await loadInProgressTasks()
    ElMessage.success('已删除')
  } catch (error) {
  }
}

const focusNewTask = () => {
  newTaskInputRef.value?.focus()
}

const showAddTaskDialog = () => {
  if (!newTaskTitle.value.trim()) return
  showNewTaskDetails.value = true
}

const cancelAddTask = () => {
  showNewTaskDetails.value = false
  newTaskTitle.value = ''
  newTaskDeadline.value = null
  newTaskExpected.value = null
}

const createTask = async () => {
  if (!newTaskTitle.value.trim()) return

  // 4. 添加校验：预计完成时间要小于截止时间
  if (newTaskExpected.value && newTaskDeadline.value) {
    if (dayjs(newTaskExpected.value).isAfter(dayjs(newTaskDeadline.value))) {
      ElMessage.warning('预计完成时间不能晚于截止时间')
      return
    }
  }

  try {
    await api.post('/tasks', {
      title: newTaskTitle.value.trim(),
      content: '',
      status: 'todo',
      priority: 1,
      deadline: newTaskDeadline.value || undefined,
      expected_completion_date: newTaskExpected.value || undefined
    })
    newTaskTitle.value = ''
    newTaskDeadline.value = null
    newTaskExpected.value = null
    showNewTaskDetails.value = false
    await loadInProgressTasks()
    ElMessage.success('任务已创建')
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const loadAllData = async () => {
  initDateRanges()
  await Promise.all([loadWeek1Tasks(), loadWeek2Tasks(), loadInProgressTasks()])
}

onMounted(loadAllData)
</script>

<style scoped>
.work-dashboard {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.completed-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* margin-bottom: 30px; Remove bottom margin as it's now at bottom */
}

/* Add margin bottom to inprogress section since it's now on top */
.inprogress-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.completed-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

/* 新增样式：可点击的头部和左侧布局 */
.section-header.clickable {
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-icon {
  font-size: 14px;
  color: #909399;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.date-range-picker {
  width: 280px;
}

.sort-buttons {
  display: flex;
  gap: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.task-row:hover {
  background-color: #f5f7fa;
}

.task-row:hover .delete-btn {
  opacity: 1;
}

.task-row.completed {
  background-color: #f0fdf4;
}

.task-checkbox {
  margin-right: 12px;
}

.task-title {
  flex: 1;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: color 0.2s;
}

.task-title:hover {
  color: #409eff;
}

.task-title.done {
  color: #67c23a;
}

.task-title-input {
  flex: 1;
  border: 1px solid #409eff;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  outline: none;
}

.task-meta {
  display: flex;
  gap: 16px;
  margin-left: 12px;
}

.meta-item {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.deadline-meta {
  color: #e6a23c;
}

.expected-meta {
  color: #909399;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
  margin-left: 8px;
}

.add-task-section {
  margin-top: 8px;
}

.add-task-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px dashed #dcdfe6;
  background-color: transparent;
  transition: all 0.2s;
}

.add-task-row:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.add-icon {
  font-size: 18px;
  color: #909399;
  margin-right: 12px;
  font-weight: 300;
}

.new-task-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  color: #606266;
}

.new-task-input::placeholder {
  color: #c0c4cc;
}

.new-task-details {
  margin-top: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.detail-label {
  width: 80px;
  font-size: 13px;
  color: #606266;
}

.detail-picker {
  flex: 1;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.empty-hint {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 12px 0;
}
</style>