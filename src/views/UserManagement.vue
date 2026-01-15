<template>
  <div class="user-management">
    <div class="header">
      <div class="header-top">
        <h2>用户管理</h2>
        <el-button type="primary" @click="showCreateDialog = true">新增用户</el-button>
      </div>
      <el-alert
        title="仅管理员可访问此页面"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <el-table :data="users" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" min-width="150" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="200">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="danger"
            size="small"
            :disabled="row.id === 1"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="footer-note">
      <el-alert
        title="注意：删除用户将同时删除该用户的所有任务和列表数据，且不可恢复！"
        type="warning"
        :closable="false"
        show-icon
      />
    </div>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="showCreateDialog" title="新增用户" width="500px">
      <el-form :model="newUser" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="newUser.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="newUser.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="newUser.role" placeholder="请选择角色">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../api/client';

interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

const users = ref<User[]>([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const creating = ref(false);
const newUser = ref({
  username: '',
  password: '',
  role: 'user'
});

const loadUsers = async () => {
  loading.value = true;
  try {
    const res: any = await api.get('/users');
    users.value = res.data || [];
  } catch (error: any) {
    if (error.response?.status === 403) {
      ElMessage.error('权限不足：仅管理员可访问');
    } else {
      ElMessage.error('加载用户列表失败');
    }
  } finally {
    loading.value = false;
  }
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

const handleDelete = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定删除用户 "${user.username}"？\n\n此操作将删除该用户的所有任务和列表数据，且不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    );

    loading.value = true;
    await api.delete(`/users/${user.id}`);
    ElMessage.success('删除成功');
    loadUsers();
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('删除失败：' + (error.response?.data?.error || '未知错误'));
    }
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (!newUser.value.username || !newUser.value.password) {
    ElMessage.warning('请填写用户名和密码');
    return;
  }

  creating.value = true;
  try {
    await api.post('/users', newUser.value);
    ElMessage.success('创建成功');
    showCreateDialog.value = false;
    // 重置表单
    newUser.value = {
      username: '',
      password: '',
      role: 'user'
    };
    loadUsers();
  } catch (error: any) {
    ElMessage.error('创建失败：' + (error.response?.data?.error || '未知错误'));
  } finally {
    creating.value = false;
  }
};

onMounted(loadUsers);
</script>

<style scoped>
.header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header h2 {
  margin: 0;
}

.footer-note {
  margin-top: 20px;
}
</style>
