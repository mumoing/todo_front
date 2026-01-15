<template>
  <el-dialog v-model="visible" title="从时间段导入任务" width="500px">
    <el-form label-width="120px">
      <el-form-item label="时间段">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="时间模式">
        <el-select v-model="config.timeMode" placeholder="选择时间模式">
          <el-option label="按 Deadline" value="deadline">
            <div class="option-detail">
              <div>按 Deadline</div>
              <div class="option-desc">导入在该时间段内的 deadline 任务</div>
            </div>
          </el-option>
          <el-option label="按预计完成时间" value="expected">
            <div class="option-detail">
              <div>按预计完成时间</div>
              <div class="option-desc">导入在该时间段内的预计完成任务</div>
            </div>
          </el-option>
          <el-option label="按完成时间" value="completed">
            <div class="option-detail">
              <div>按完成时间</div>
              <div class="option-desc">导入在该时间段内已完成的任务</div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-alert
          title="提示：将导入符合条件的任务到当前固定列表（不会删除原任务）"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleImport" :loading="importing">
        导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import api from '../api/client';

const props = defineProps<{
  modelValue: boolean;
  listId: string | number;
}>();

const emit = defineEmits(['update:modelValue', 'success']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const dateRange = ref<[string, string] | null>(null);
const config = ref({
  timeMode: 'deadline'
});
const importing = ref(false);

const handleImport = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择时间段');
    return;
  }

  importing.value = true;
  try {
    const res: any = await api.post(`/fixed-lists/${props.listId}/import`, {
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
      timeMode: config.value.timeMode
    });

    ElMessage.success(`成功导入 ${res.count || 0} 个任务`);
    visible.value = false;
    emit('success');
  } catch (error: any) {
    ElMessage.error('导入失败：' + (error.response?.data?.error || '未知错误'));
  } finally {
    importing.value = false;
  }
};
</script>

<style scoped>
.option-detail {
  line-height: 1.5;
}

.option-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
</style>
