<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑任务' : '新增任务'" width="500px">
    <el-form :model="form" label-width="100px" @keyup.enter="save">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" ref="titleInputRef" />
      </el-form-item>
      <el-form-item label="内容">
        <el-input type="textarea" v-model="form.content" />
      </el-form-item>
      <el-form-item label="优先级">
        <el-select v-model="form.priority">
          <el-option label="低" :value="0" />
          <el-option label="中" :value="1" />
          <el-option label="高" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="预计完成">
        <el-date-picker v-model="form.expected_completion_date" type="datetime" />
      </el-form-item>
      <el-form-item label="最后期限">
        <el-date-picker v-model="form.deadline" type="datetime" />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio label="todo">进行中</el-radio>
          <el-radio label="done">已完成</el-radio>
          <el-radio label="discarded">已废弃</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import api from '../api/client';
import type { Task } from '../api/types';

const visible = ref(false);
const emit = defineEmits(['success']);
const titleInputRef = ref();

// 默认时间为2099年
const defaultDate = new Date('2099-12-31T23:59:59');

const defaultForm = {
  title: '', content: '', priority: 1, status: 'todo',
  expected_completion_date: defaultDate,
  deadline: defaultDate
};
const form = ref<any>({ ...defaultForm });

const open = (task?: Task) => {
  if (task) {
    form.value = {
      ...task,
      expected_completion_date: task.expected_completion_date ? new Date(task.expected_completion_date) : defaultDate,
      deadline: task.deadline ? new Date(task.deadline) : defaultDate
    };
  } else {
    form.value = { ...defaultForm };
  }
  visible.value = true;
  // 自动聚焦到标题输入框
  nextTick(() => {
    titleInputRef.value?.focus();
  });
};

const save = async () => {
  if (!form.value.title.trim()) {
    return;
  }

  if (form.value.id) {
    await api.put(`/tasks/${form.value.id}`, form.value);
  } else {
    await api.post('/tasks', form.value);
  }
  visible.value = false;
  emit('success');
};

defineExpose({ open });
</script>