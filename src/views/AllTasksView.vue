<template>
  <div class="all-tasks-view">
    <div class="header">
      <h2>全量任务报表</h2>
      <div class="actions">
        <el-button type="primary" @click="openTaskDialog()">新增任务</el-button>
        <el-button type="success" @click="showExport = true">导出 TXT</el-button>
      </div>
    </div>

    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索标题或内容"
        @keyup.enter="handleSearch"
        style="width: 300px"
        clearable
      >
        <template #append>
          <el-button icon="Search" @click="handleSearch" />
        </template>
      </el-input>

      <el-select v-model="statusFilter" @change="handleSearch" placeholder="状态过滤" style="width: 150px">
        <el-option label="全部状态" value="" />
        <el-option label="待办" value="todo" />
        <el-option label="已完成" value="done" />
        <el-option label="已废弃" value="discarded" />
      </el-select>
    </div>

    <div class="stats">
      <el-statistic title="总任务数" :value="allTasks.length" />
      <el-statistic title="待办" :value="todoCount" />
      <el-statistic title="已完成" :value="doneCount" />
      <el-statistic title="已废弃" :value="discardedCount" />
    </div>

    <el-table
      :data="paginatedTasks"
      style="width: 100%"
      stripe
      :default-sort="{ prop: 'deadline', order: 'ascending' }"
    >
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'todo'" type="warning">待办</el-tag>
          <el-tag v-else-if="row.status === 'done'" type="success">已完成</el-tag>
          <el-tag v-else type="info">已废弃</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100" sortable />
      <el-table-column prop="deadline" label="Deadline" width="180" sortable>
        <template #default="{ row }">
          {{ formatDate(row.deadline) }}
        </template>
      </el-table-column>
      <el-table-column prop="expected_completion_date" label="预计完成" width="180" sortable>
        <template #default="{ row }">
          {{ formatDate(row.expected_completion_date) }}
        </template>
      </el-table-column>
      <el-table-column prop="completed_at" label="完成时间" width="180" sortable>
        <template #default="{ row }">
          {{ formatDate(row.completed_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openTaskDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteTask(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="filteredTasks.length > 0"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="filteredTasks.length"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      style="margin-top: 20px; justify-content: center;"
    />

    <TaskDialog ref="taskDialogRef" @success="loadData" />
    <ExportDialog
      v-model="showExport"
      :source-data="filteredTasks.map(t => ({ task: t }))"
      :title="exportTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../api/client';
import TaskDialog from '../components/TaskDialog.vue';
import ExportDialog from '../components/ExportDialog.vue';

const keyword = ref('');
const statusFilter = ref('');
const sortMode = ref('deadline');
const allTasks = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const taskDialogRef = ref();
const showExport = ref(false);

const exportTitle = computed(() => {
  let title = '全量任务';
  if (statusFilter.value) {
    const statusMap: any = { todo: '待办', done: '已完成', discarded: '已废弃' };
    title += `-${statusMap[statusFilter.value]}`;
  }
  if (keyword.value) {
    title += `-${keyword.value}`;
  }
  return title;
});

const todoCount = computed(() => allTasks.value.filter(t => t.status === 'todo').length);
const doneCount = computed(() => allTasks.value.filter(t => t.status === 'done').length);
const discardedCount = computed(() => allTasks.value.filter(t => t.status === 'discarded').length);

const filteredTasks = computed(() => {
  return allTasks.value;
});

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTasks.value.slice(start, end);
});

const loadData = async () => {
  try {
    const res: any = await api.get('/tasks/all', {
      params: {
        keyword: keyword.value,
        status: statusFilter.value
      }
    });
    allTasks.value = res.data || [];
    handleSort();
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

const handleSort = () => {
  allTasks.value.sort((a, b) => {
    if (sortMode.value === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortMode.value === 'expected') {
      if (!a.expected_completion_date) return 1;
      if (!b.expected_completion_date) return -1;
      return new Date(a.expected_completion_date).getTime() -
             new Date(b.expected_completion_date).getTime();
    } else if (sortMode.value === 'completed') {
      if (!a.completed_at) return 1;
      if (!b.completed_at) return -1;
      return new Date(b.completed_at).getTime() -
             new Date(a.completed_at).getTime();
    } else if (sortMode.value === 'priority') {
      return (b.priority || 0) - (a.priority || 0);
    }
    return 0;
  });
};

const handlePageChange = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const openTaskDialog = (task?: any) => {
  taskDialogRef.value.open(task);
};

const deleteTask = async (task: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除任务 "${task.title}"？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await api.delete(`/tasks/${task.id}`);
    ElMessage.success('删除成功');
    loadData();
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('删除失败');
    }
  }
};

onMounted(loadData);
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stats {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.task-list {
  min-height: 400px;
  margin-bottom: 20px;
}

.el-pagination {
  justify-content: center;
}
</style>
