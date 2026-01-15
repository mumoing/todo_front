<template>
  <div class="board" @keyup.enter="handleEnterKey" tabindex="0" ref="boardRef">
    <div class="header">
      <h2>{{ pageTitle }}</h2>
      <div class="actions">
        <el-button type="primary" @click="openTaskDialog()">新增任务</el-button>
        <el-button type="success" @click="showExport = true">导出 TXT</el-button>
        <el-button v-if="viewType === 'fixed'" type="warning" @click="importTasks">导入时间段数据</el-button>
      </div>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="sortMode" @change="sortTasks">
        <el-radio-button label="deadline">按 Deadline 排序</el-radio-button>
        <el-radio-button label="priority">按优先级排序</el-radio-button>
      </el-radio-group>
    </div>

    <div class="task-list">
      <el-empty v-if="tasks.length === 0" description="暂无任务" />
      
      <TaskItem 
        v-for="item in tasks" 
        :key="item.id" 
        :data="item" 
        :is-reference="viewType === 'fixed'"
        @edit="openTaskDialog"
        @refresh="loadData"
      />
    </div>

    <TaskDialog ref="taskDialogRef" @success="loadData" />
    <ExportDialog v-model="showExport" :source-data="tasks" :title="pageTitle" />
    <ImportDialog v-model="showImport" :list-id="id || ''" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import api from '../api/client';
import TaskItem from '../components/TaskItem.vue';
import TaskDialog from '../components/TaskDialog.vue';
import ExportDialog from '../components/ExportDialog.vue';
import ImportDialog from '../components/ImportDialog.vue';
import type { Task } from '../api/types';

const props = defineProps<{
  viewType: 'todo' | 'time' | 'fixed';
  id?: string; // 路由参数
}>();

const tasks = ref<any[]>([]); // 可能是 Task[] 或 FixedListItem[]
const sortMode = ref('deadline');
const showExport = ref(false);
const showImport = ref(false);
const taskDialogRef = ref();
const boardRef = ref<HTMLElement>();

const pageTitle = computed(() => {
  if (props.viewType === 'todo') return '待办事项';
  if (props.viewType === 'time') return `时间视图: ${props.id}`;
  if (props.viewType === 'fixed') return '固定列表 (引用模式)';
  return '任务列表';
});

// 加载数据
const loadData = async () => {
  let url = '/tasks';
  const params: any = {};

  if (props.viewType === 'todo') {
    params.status = 'todo'; // 默认只拉取未完成
  } else if (props.viewType === 'time') {
    url = '/tasks/time-segment';
    params.mode = props.id; // deadline, expected, etc.
    // 这里需要根据业务传递 start/end date，暂时省略
  } else if (props.viewType === 'fixed') {
    url = `/fixed-lists/${props.id}/items`;
  }

  const res: any = await api.get(url, { params });
  tasks.value = res.data || [];
  sortTasks();
};

// 前端排序 (后端也可排，但前端排响应更快)
const sortTasks = () => {
  tasks.value.sort((a, b) => {
    // 兼容 FixedListItem 结构 (有一层 .task 包装)
    const taskA = a.task || a;
    const taskB = b.task || b;

    if (sortMode.value === 'deadline') {
      // 处理 NULL deadline 放到最后
      if (!taskA.deadline) return 1;
      if (!taskB.deadline) return -1;
      return new Date(taskA.deadline).getTime() - new Date(taskB.deadline).getTime();
    } else {
      return (taskB.priority || 0) - (taskA.priority || 0); // 高优先级在前
    }
  });
};

const openTaskDialog = (task?: Task) => {
  taskDialogRef.value.open(task);
};

const importTasks = () => {
    showImport.value = true;
};

const handleEnterKey = () => {
  openTaskDialog();
};

watch(() => props.id, loadData);
onMounted(() => {
  loadData();
  // 自动聚焦到容器，使 Enter 键可以直接使用
  nextTick(() => {
    boardRef.value?.focus();
  });
});
</script>

<style scoped>
.board:focus {
  outline: none;
}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.toolbar { margin-bottom: 15px; }
</style>