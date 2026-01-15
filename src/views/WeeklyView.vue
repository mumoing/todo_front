<template>
  <div class="weekly-view" v-loading="loading">
    <div class="header">
      <h2>按周时间段视图</h2>
      <div class="header-actions">
        <el-button @click="toggleAllSegments(true)" size="small" :disabled="segments.length === 0">全部展开</el-button>
        <el-button @click="toggleAllSegments(false)" size="small" :disabled="segments.length === 0">全部收起</el-button>
        <el-button type="success" @click="showExport = true" :disabled="allTasks.length === 0">导出 TXT</el-button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-row">
        <div class="time-mode-label">时间维度：</div>
        <el-radio-group v-model="timeMode" @change="loadData" size="default">
          <el-radio-button label="deadline">按 Deadline</el-radio-button>
          <el-radio-button label="expected">按预计完成</el-radio-button>
          <el-radio-button label="completed">按完成时间</el-radio-button>
        </el-radio-group>
        <el-tag v-if="getTotalTasksCount() > 0" type="info" size="small">
          共找到 {{ getTotalTasksCount() }} 个任务
        </el-tag>

        <el-select v-model="weeks" @change="loadData" style="width: 200px">
          <el-option label="过去3段+未来3段" :value="6" />
          <el-option label="过去4段+未来4段" :value="8" />
          <el-option label="过去6段+未来6段" :value="12" />
          <el-option label="过去13段+未来13段" :value="26" />
        </el-select>

        <el-select v-model="weekLength" @change="loadData" style="width: 140px">
          <el-option label="每段3天" :value="3" />
          <el-option label="每段5天" :value="5" />
          <el-option label="每段7天" :value="7" />
          <el-option label="每段10天" :value="10" />
          <el-option label="每段14天" :value="14" />
        </el-select>
      </div>

      <div class="toolbar-row">
        <el-date-picker
          v-model="startDate"
          type="date"
          placeholder="选择起始日期"
          @change="loadData"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 180px"
          clearable
        >
          <template #default>
            <el-button size="small" @click="setDateShortcut('today')">今天</el-button>
            <el-button size="small" @click="setDateShortcut('thisWeek')">本周一</el-button>
            <el-button size="small" @click="setDateShortcut('thisMonth')">本月1号</el-button>
          </template>
        </el-date-picker>

        <el-button-group>
          <el-button size="small" @click="setDateShortcut('today')">今天</el-button>
          <el-button size="small" @click="setDateShortcut('thisWeek')">本周一</el-button>
          <el-button size="small" @click="setDateShortcut('thisMonth')">本月1号</el-button>
        </el-button-group>

        <el-radio-group v-model="sortMode" @change="sortTasks" size="default">
          <el-radio-button label="deadline">按 Deadline</el-radio-button>
          <el-radio-button label="priority">按优先级</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="week-segments">
      <div v-if="segments.length > 0" class="segments-hint">
        <el-alert
          :title="getTimeModeHint()"
          type="info"
          :closable="false"
          show-icon
        />
      </div>

      <el-empty v-if="!loading && segments.length === 0" description="暂无数据" />

      <el-collapse v-model="activeNames" v-if="segments.length > 0">
        <el-collapse-item
          v-for="(segment, index) in segments"
          :key="segment.title"
          :name="segment.title"
          :class="{ 'current-period': isCurrentPeriod(segment) }"
        >
          <template #title>
            <div class="collapse-title">
              <div class="title-left">
                <el-tag v-if="isCurrentPeriod(segment)" type="success" size="small" class="current-tag">
                  当前
                </el-tag>
                <span class="week-title">{{ getSegmentTitle(segment, index) }}</span>
              </div>
              <div class="title-right">
                <el-tag v-if="getCompletedCount(segment) > 0" type="success" size="small">
                  完成 {{ getCompletedCount(segment) }}
                </el-tag>
                <el-tag v-if="getTodoCount(segment) > 0" type="warning" size="small">
                  待办 {{ getTodoCount(segment) }}
                </el-tag>
                <el-tag type="info" size="small">共 {{ segment.tasks.length }} 项</el-tag>
              </div>
            </div>
          </template>

          <div v-if="segment.tasks.length === 0" class="empty-week">
            本时间段无任务
          </div>
          <TaskItem
            v-for="task in segment.tasks.filter((t: any) => t && t.id)"
            :key="task.id"
            :data="{ task }"
            :is-reference="false"
            @edit="openTaskDialog"
            @refresh="loadData"
          />
        </el-collapse-item>
      </el-collapse>
    </div>

    <TaskDialog ref="taskDialogRef" @success="loadData" />
    <ExportDialog v-model="showExport" :source-data="allTasks" :title="exportTitle" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '../api/client';
import TaskItem from '../components/TaskItem.vue';
import TaskDialog from '../components/TaskDialog.vue';
import ExportDialog from '../components/ExportDialog.vue';

const timeMode = ref('deadline');
const weeks = ref(6);
const weekLength = ref(7);
const startDate = ref('');
const sortMode = ref('deadline');
const segments = ref<any[]>([]);
const activeNames = ref<string[]>([]);
const showExport = ref(false);
const taskDialogRef = ref();
const loading = ref(false);

const exportTitle = computed(() => {
  const modeText = timeMode.value === 'deadline' ? 'Deadline' :
                   timeMode.value === 'expected' ? '预计完成' : '完成时间';
  const weeksText = weeks.value === 6 ? '过去3段+未来3段' :
                    weeks.value === 8 ? '过去4段+未来4段' :
                    weeks.value === 12 ? '过去6段+未来6段' : `${weeks.value}段`;
  const lengthText = weekLength.value === 7 ? '' : `-每段${weekLength.value}天`;
  const dateText = startDate.value ? `-起始${startDate.value}` : '';
  return `按周视图-${modeText}-${weeksText}${lengthText}${dateText}`;
});

const allTasks = computed(() => {
  return segments.value.flatMap(s => s.tasks.filter((t: any) => t && t.id).map((task: any) => ({ task })));
});

// 快捷日期设置
const setDateShortcut = (type: string) => {
  const now = new Date();
  let targetDate: Date;

  switch (type) {
    case 'today':
      targetDate = now;
      break;
    case 'thisWeek':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      targetDate = new Date(now.getFullYear(), now.getMonth(), diff);
      break;
    case 'thisMonth':
      targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      targetDate = now;
  }

  const dateStr = targetDate.toISOString().split('T')[0];
  if (dateStr) {
    startDate.value = dateStr;
  }
  loadData();
};

// 判断是否是当前时间段
const isCurrentPeriod = (segment: any) => {
  if (!segment || !segment.startDate || !segment.endDate) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  if (!todayStr) return false;
  return todayStr >= segment.startDate && todayStr <= segment.endDate;
};

// 获取更友好的时间段标题
const getSegmentTitle = (segment: any, index: number) => {
  const start = new Date(segment.startDate);
  const end = new Date(segment.endDate);
  const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
  const endStr = `${end.getMonth() + 1}/${end.getDate()}`;

  // 计算是第几周（相对于起始周）
  const baseIndex = Math.floor(weeks.value / 2);
  const weekOffset = index - baseIndex;
  const weekLabel = weekOffset === 0 ? '当前' :
                    weekOffset > 0 ? `+${weekOffset}` : `${weekOffset}`;

  return `${startStr} - ${endStr} (${weekLabel})`;
};

// 获取完成任务数
const getCompletedCount = (segment: any) => {
  return segment.tasks.filter((t: any) => t.status === 'done').length;
};

// 获取待办任务数
const getTodoCount = (segment: any) => {
  return segment.tasks.filter((t: any) => t.status === 'todo').length;
};

// 获取所有任务总数
const getTotalTasksCount = () => {
  return segments.value.reduce((total, segment) => total + segment.tasks.length, 0);
};

// 获取时间模式提示
const getTimeModeHint = () => {
  const modeText = timeMode.value === 'deadline' ? 'Deadline（截止日期）' :
                   timeMode.value === 'expected' ? '预计完成时间' : '实际完成时间';
  const count = getTotalTasksCount();
  return `当前按 ${modeText} 筛选，共找到 ${count} 个任务`;
};

// 全部展开/收起
const toggleAllSegments = (expand: boolean) => {
  if (expand) {
    activeNames.value = segments.value.map(s => s.title);
  } else {
    activeNames.value = [];
  }
};

const loadData = async () => {
  if (loading.value) return; // 防止重复请求

  loading.value = true;
  try {
    const params: any = {
      timeMode: timeMode.value,
      weeks: weeks.value,
      weekLength: weekLength.value
    };

    if (startDate.value) {
      params.startDate = startDate.value;
    }

    const res: any = await api.get('/tasks/weekly-segments', { params });
    const newSegments = res.data || [];

    // 保存之前展开的时间段标题
    const previouslyActive = new Set(activeNames.value);

    segments.value = newSegments;
    sortTasks();

    // 智能展开逻辑：
    // 1. 如果之前有展开的，尽量保持展开状态
    // 2. 如果之前展开的时间段仍然存在，继续展开
    // 3. 否则展开当前时间段或第一个有任务的时间段
    if (segments.value.length > 0) {
      const stillActiveSegments = segments.value.filter(s => previouslyActive.has(s.title));

      if (stillActiveSegments.length > 0) {
        // 保持之前展开的状态
        activeNames.value = stillActiveSegments.map(s => s.title);
      } else {
        // 智能选择：优先展开有任务的当前时间段
        const currentSegment = segments.value.find(s => isCurrentPeriod(s) && s.tasks.length > 0);
        if (currentSegment) {
          activeNames.value = [currentSegment.title];
        } else {
          // 找到第一个有任务的时间段
          const firstWithTasks = segments.value.find(s => s.tasks.length > 0);
          if (firstWithTasks) {
            activeNames.value = [firstWithTasks.title];
          } else if (segments.value.length > 0) {
            // 如果都没有任务，展开当前时间段或第一个
            const fallbackSegment = segments.value.find(s => isCurrentPeriod(s)) || segments.value[0];
            activeNames.value = [fallbackSegment.title];
          }
        }
      }
    } else {
      activeNames.value = [];
    }
  } catch (error: any) {
    console.error('加载数据失败:', error);
    ElMessage.error(error.response?.data?.error || '加载数据失败');
  } finally {
    loading.value = false;
  }
};

const sortTasks = () => {
  segments.value.forEach(segment => {
    if (!segment.tasks) segment.tasks = [];
    segment.tasks.sort((a: any, b: any) => {
      if (sortMode.value === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else {
        return (b.priority || 0) - (a.priority || 0);
      }
    });
  });
};

const openTaskDialog = (task?: any) => {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.toolbar-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.time-mode-label {
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.week-segments {
  margin-top: 20px;
}

.segments-hint {
  margin-bottom: 15px;
}

.collapse-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 20px;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-right {
  display: flex;
  gap: 6px;
}

.current-tag {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.week-title {
  font-weight: 500;
  font-size: 15px;
}

.current-period {
  background-color: #f0f9ff;
}

.current-period :deep(.el-collapse-item__header) {
  background-color: #ecfdf5;
  font-weight: 600;
}

.empty-week {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
