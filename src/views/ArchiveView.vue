<template>
  <div class="archive-view">
    <div class="header">
      <h2>报表/归档</h2>
      <el-button type="success" @click="showExport = true">导出当前列表</el-button>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="period" @change="handlePeriodChange">
        <el-radio-button label="year">按年</el-radio-button>
        <el-radio-button label="month">按月</el-radio-button>
        <el-radio-button label="quarter">按季度</el-radio-button>
      </el-radio-group>

      <el-date-picker
        v-if="period === 'year'"
        v-model="selectedYear"
        type="year"
        placeholder="选择年份"
        @change="loadData"
        format="YYYY"
        value-format="YYYY"
      />

      <el-date-picker
        v-if="period === 'month'"
        v-model="selectedMonth"
        type="month"
        placeholder="选择月份"
        @change="loadData"
        format="YYYY-MM"
        value-format="YYYY-MM"
      />

      <template v-if="period === 'quarter'">
        <el-input v-model="quarterYear" placeholder="年份" style="width: 100px" @change="loadData" />
        <el-select v-model="selectedQuarter" @change="loadData" style="width: 160px">
          <el-option label="第一季度 (1-3月)" value="Q1" />
          <el-option label="第二季度 (4-6月)" value="Q2" />
          <el-option label="第三季度 (7-9月)" value="Q3" />
          <el-option label="第四季度 (10-12月)" value="Q4" />
        </el-select>
      </template>

      <el-radio-group v-model="sortMode" @change="sortTasks">
        <el-radio-button label="completed">按完成时间</el-radio-button>
        <el-radio-button label="priority">按优先级</el-radio-button>
      </el-radio-group>
    </div>

    <div class="stats">
      <el-statistic title="总任务数" :value="tasks.length" />
      <el-statistic title="已完成" :value="completedCount">
        <template #suffix>
          <span class="stat-suffix">{{ completedPercent }}%</span>
        </template>
      </el-statistic>
      <el-statistic title="已废弃" :value="discardedCount">
        <template #suffix>
          <span class="stat-suffix">{{ discardedPercent }}%</span>
        </template>
      </el-statistic>
    </div>

    <div class="task-list">
      <el-empty v-if="tasks.length === 0" description="该时间段无已完成任务" />

      <TaskItem
        v-for="task in tasks.filter(t => t && t.id)"
        :key="task.id"
        :data="{ task }"
        :is-reference="false"
        @edit="openTaskDialog"
        @refresh="loadData"
      />
    </div>

    <TaskDialog ref="taskDialogRef" @success="loadData" />
    <ExportDialog
      v-model="showExport"
      :source-data="tasks.map(t => ({ task: t }))"
      :title="exportTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api/client';
import TaskItem from '../components/TaskItem.vue';
import TaskDialog from '../components/TaskDialog.vue';
import ExportDialog from '../components/ExportDialog.vue';

const period = ref('month');
const selectedYear = ref(new Date().getFullYear().toString());
const selectedMonth = ref(new Date().toISOString().substring(0, 7));
const selectedQuarter = ref('Q1');
const quarterYear = ref(new Date().getFullYear().toString());
const sortMode = ref('completed');
const tasks = ref<any[]>([]);
const showExport = ref(false);
const taskDialogRef = ref();

const completedCount = computed(() =>
  tasks.value.filter(t => t.status === 'done').length
);

const discardedCount = computed(() =>
  tasks.value.filter(t => t.status === 'discarded').length
);

const completedPercent = computed(() => {
  if (tasks.value.length === 0) return 0;
  return Math.round((completedCount.value / tasks.value.length) * 100);
});

const discardedPercent = computed(() => {
  if (tasks.value.length === 0) return 0;
  return Math.round((discardedCount.value / tasks.value.length) * 100);
});

const exportTitle = computed(() => {
  if (period.value === 'year') {
    return `${selectedYear.value}年归档`;
  } else if (period.value === 'month') {
    return `${selectedMonth.value}归档`;
  } else {
    return `${quarterYear.value}年${selectedQuarter.value}归档`;
  }
});

const loadData = async () => {
  let value = '';
  if (period.value === 'year') {
    value = selectedYear.value;
  } else if (period.value === 'month') {
    value = selectedMonth.value;
  } else {
    value = `${quarterYear.value}-${selectedQuarter.value}`;
  }

  try {
    const res: any = await api.get('/tasks/archive', {
      params: { period: period.value, value }
    });
    tasks.value = res.data || [];
    sortTasks();
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

const sortTasks = () => {
  tasks.value.sort((a, b) => {
    if (sortMode.value === 'completed') {
      if (!a.completed_at) return 1;
      if (!b.completed_at) return -1;
      return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
    } else {
      return (b.priority || 0) - (a.priority || 0);
    }
  });
};

const handlePeriodChange = () => {
  tasks.value = [];
  // 重置选择
  if (period.value === 'year') {
    selectedYear.value = new Date().getFullYear().toString();
  } else if (period.value === 'month') {
    selectedMonth.value = new Date().toISOString().substring(0, 7);
  }
  loadData();
};

const openTaskDialog = (task: any) => {
  taskDialogRef.value.open(task);
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

.toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.stats {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stat-suffix {
  font-size: 14px;
  margin-left: 5px;
  color: #909399;
}

.task-list {
  min-height: 300px;
}
</style>
