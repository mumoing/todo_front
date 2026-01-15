<template>
  <el-card class="task-item" :class="statusClass">
    <div class="content-wrapper">
      <div class="main-info">
        <el-checkbox v-model="isCompleted" @change="toggleStatus" size="large">
          <input
            v-if="isEditingTitle"
            v-model="editingTitle"
            @blur="saveTitle"
            @keyup.enter="saveTitle"
            @keyup.esc="cancelEditTitle"
            class="title-input"
            ref="titleInputRef"
            autofocus
          />
          <span
            v-else
            class="title"
            :class="{ done: isCompleted }"
            @dblclick="startEditTitle"
            title="双击编辑标题"
          >
            {{ taskData.title }}
          </span>
        </el-checkbox>

        <el-tag size="small" :type="priorityType" class="ml-2">{{ priorityLabel }}</el-tag>
        <el-tag size="small" type="info" class="ml-2">{{ expectedDesc }}</el-tag>

        <el-select
          v-model="currentStatus"
          @change="changeStatus"
          size="small"
          class="ml-2 status-select"
        >
          <el-option label="待办" value="todo" />
          <el-option label="完成" value="done" />
          <el-option label="废弃" value="discarded" />
        </el-select>

        <span v-if="taskData.deadline" class="deadline">
            Deadline: {{ formatDate(taskData.deadline) }}
        </span>
      </div>

      <div class="desc" v-if="taskData.content">
        {{ taskData.content }}
      </div>

      <div class="meta-info">
        <span class="meta-item">创建: {{ formatDate(taskData.created_at) }}</span>
        <span class="meta-item">修改: {{ formatDate(taskData.updated_at) }}</span>
        <span v-if="taskData.completed_at" class="meta-item">完成: {{ formatDate(taskData.completed_at) }}</span>
      </div>
    </div>

    <div class="actions">
      <el-button link type="primary" @click="$emit('edit', taskData)">编辑详情</el-button>

      <template v-if="isReference">
        <el-popconfirm title="仅从此列表移除，保留原始任务？" @confirm="handleUnlink">
          <template #reference>
            <el-button link type="warning">移出列表</el-button>
          </template>
        </el-popconfirm>
      </template>

      <el-popconfirm title="警告：彻底删除将从所有地方消失！" @confirm="handleDelete">
         <template #reference>
           <el-button link type="danger">彻底删除</el-button>
         </template>
      </el-popconfirm>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { formatDate, getExpectedDesc } from '../utils/date';
import api from '../api/client';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  data: any; // Task or FixedListItem
  isReference: boolean;
}>();

const emit = defineEmits(['refresh', 'edit']);

// 统一提取 Task 数据对象
const taskData = computed(() => props.isReference ? props.data.task : props.data);
const itemId = computed(() => props.isReference ? props.data.id : null); // 引用关系的ID

const isCompleted = computed({
  get: () => taskData.value.status === 'done',
  set: () => {} // logic handled in toggleStatus
});

const statusClass = computed(() => {
    if (taskData.value.status === 'done') return 'bg-done';
    if (taskData.value.status === 'discarded') return 'bg-discarded';
    return '';
});

const expectedDesc = computed(() => getExpectedDesc(taskData.value.expected_completion_date));

const priorityLabel = computed(() => ['低', '中', '高'][taskData.value.priority] || '无');
const priorityType = computed(() => ['info', 'warning', 'danger'][taskData.value.priority] || 'info');

// 标题编辑相关
const isEditingTitle = ref(false);
const editingTitle = ref('');
const titleInputRef = ref<HTMLInputElement>();

const startEditTitle = () => {
  isEditingTitle.value = true;
  editingTitle.value = taskData.value.title;
  nextTick(() => {
    titleInputRef.value?.focus();
    titleInputRef.value?.select();
  });
};

const saveTitle = async () => {
  if (!editingTitle.value.trim()) {
    ElMessage.warning('标题不能为空');
    return;
  }

  if (editingTitle.value === taskData.value.title) {
    isEditingTitle.value = false;
    return;
  }

  try {
    await api.put(`/tasks/${taskData.value.id}`, {
      ...taskData.value,
      title: editingTitle.value
    });
    isEditingTitle.value = false;
    emit('refresh');
    ElMessage.success('标题已更新');
  } catch (error) {
    ElMessage.error('更新失败');
  }
};

const cancelEditTitle = () => {
  isEditingTitle.value = false;
  editingTitle.value = '';
};

// 状态切换相关
const currentStatus = computed({
  get: () => taskData.value.status,
  set: () => {} // logic handled in changeStatus
});

const changeStatus = async (newStatus: string) => {
  if (newStatus === taskData.value.status) return;

  try {
    await api.put(`/tasks/${taskData.value.id}`, {
      ...taskData.value,
      status: newStatus
    });
    emit('refresh');
    ElMessage.success('状态已更新');
  } catch (error) {
    ElMessage.error('更新失败');
  }
};

const toggleStatus = async (val: boolean) => {
  const newStatus = val ? 'done' : 'todo';
  await api.put(`/tasks/${taskData.value.id}`, { ...taskData.value, status: newStatus });
  emit('refresh');
};

const handleUnlink = async () => {
    if (!itemId.value) return;
    await api.delete(`/fixed-lists/item/${itemId.value}`);
    emit('refresh');
};

const handleDelete = async () => {
    await api.delete(`/tasks/${taskData.value.id}`);
    emit('refresh');
};
</script>

<style scoped>
.task-item { margin-bottom: 10px; display: flex; flex-direction: column; }
.content-wrapper { padding: 5px 0; }
.actions { border-top: 1px solid #f0f0f0; padding-top: 10px; display: flex; justify-content: flex-end; }
.title {
  font-weight: bold;
  font-size: 16px;
  margin-left: 8px;
  cursor: pointer;
  transition: color 0.2s;
}
.title:hover { color: #409eff; }
.title.done { text-decoration: line-through; color: #999; }
.title-input {
  font-weight: bold;
  font-size: 16px;
  margin-left: 8px;
  border: 1px solid #409eff;
  border-radius: 4px;
  padding: 2px 8px;
  outline: none;
  min-width: 200px;
}
.deadline { margin-left: 15px; color: #f56c6c; font-size: 12px; }
.desc { color: #666; font-size: 13px; margin-top: 5px; margin-left: 30px; }
.meta-info {
  display: flex;
  gap: 15px;
  margin-top: 8px;
  margin-left: 30px;
  font-size: 11px;
  color: #999;
}
.meta-item {
  display: inline-block;
}
.ml-2 { margin-left: 8px; }
.status-select { width: 90px; }
.bg-done { background-color: #f0f9eb; }
.bg-discarded { background-color: #f4f4f5; opacity: 0.6; }
</style>