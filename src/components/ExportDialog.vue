<template>
  <el-dialog v-model="visible" title="导出列表" width="400px">
    <el-form label-width="120px">
      <el-form-item label="导出废弃项">
        <el-switch v-model="config.includeDiscarded" />
      </el-form-item>
      <el-form-item label="包含内容详情">
        <el-switch v-model="config.includeContent" />
      </el-form-item>
      <el-form-item label="序号格式">
        <el-select v-model="config.numbering">
          <el-option label="无序号" value="none" />
          <el-option label="1. 2. 3." value="dot" />
          <el-option label="1) 2) 3)" value="parenthesis" />
          <el-option label="一、二、" value="chinese" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleExport">下载 TXT</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import api from '../api/client';

const props = defineProps<{
  modelValue: boolean;
  sourceData: any[]; // 传入当前列表数据用于 ID 提取，或者直接传查询参数给后端
  title: string;
}>();

const emit = defineEmits(['update:modelValue']);
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const config = ref({
  includeDiscarded: false,
  includeContent: true,
  numbering: 'dot'
});

const handleExport = async () => {
  // 两种实现方式：
  // 1. 前端生成 TXT (简单，利用已有数据)
  // 2. 后端生成 (推荐，数据更全)

  // 这里演示调用后端 API 导出
  // 注意：需要将 sourceData 的 IDs 或者当前的查询条件传给后端
  // 为了简化，假设我们发送配置给后端，后端返回文本内容

  const res: any = await api.post('/export', {
    ...config.value,
    taskIds: props.sourceData.map(i => i.task ? i.task.id : i.id) // 提取 ID
  });

  // 触发下载
  // 注意：axios拦截器已经提取了.data，所以res就是文本内容
  const blob = new Blob([res], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.title}.txt`;
  link.click();
  visible.value = false;
};
</script>