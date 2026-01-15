<template>
  <el-container class="layout-container">
    <el-aside width="240px">
      <el-menu router :default-active="$route.path" class="el-menu-vertical">
        <div class="logo-container">
          <div class="logo">TaskFlow</div>
          <el-button type="danger" size="small" @click="handleLogout" class="logout-btn">
            退出登录
          </el-button>
        </div>

        <!-- 管理员菜单 -->
        <template v-if="isAdmin">
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </template>

        <!-- 普通用户菜单 -->
        <template v-else>
          <el-menu-item index="/dashboard">
            <el-icon><Monitor /></el-icon>
            <span>工作看板</span>
          </el-menu-item>

          <el-menu-item index="/tasks/todo">
            <el-icon><List /></el-icon>
            <span>待办事项</span>
          </el-menu-item>

          <el-menu-item index="/all-tasks">
            <el-icon><Tickets /></el-icon>
            <span>全量视图</span>
          </el-menu-item>

          <el-menu-item index="/weekly">
            <el-icon><Calendar /></el-icon>
            <span>按周视图</span>
          </el-menu-item>

          <el-menu-item index="/archive">
            <el-icon><FolderOpened /></el-icon>
            <span>归档报表</span>
          </el-menu-item>

          <el-sub-menu index="fixed">
            <template #title>
              <el-icon><Collection /></el-icon>
              <span>固定列表 (Fixed)</span>
            </template>
            <el-menu-item v-for="list in fixedLists" :key="list.id" :index="`/tasks/fixed/${list.id}`">
              {{ list.title }}
            </el-menu-item>
            <el-menu-item @click="createFixedList">
              <el-icon><Plus /></el-icon> 新增列表
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
    
    <el-main>
      <router-view :key="$route.fullPath" @refresh-menu="fetchLists" />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/client';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { FixedList } from '../api/types';

const fixedLists = ref<FixedList[]>([]);
const userRole = ref(localStorage.getItem('userRole') || 'user');
const isAdmin = ref(userRole.value === 'admin');

const fetchLists = async () => {
  const res: any = await api.get('/fixed-lists');
  fixedLists.value = res.data || [];
};

const createFixedList = async () => {
  ElMessageBox.prompt('请输入列表名称', '新增固定列表', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
  }).then(async ({ value }) => {
    if (value) {
      await api.post('/fixed-lists', { title: value });
      fetchLists();
      ElMessage.success('创建成功');
    }
  });
};

const handleLogout = () => {
  localStorage.removeItem('userRole');
  // 清除 cookie
  document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  window.location.href = '/#/login';
};

onMounted(fetchLists);
</script>

<style scoped>
.layout-container { height: 100vh; }
.el-aside { background-color: #fff; border-right: 1px solid #e6e6e6; }
.logo-container {
  padding: 15px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.logo {
  text-align: center;
  font-weight: bold;
  font-size: 20px;
  color: #409EFF;
}
.logout-btn {
  width: 100%;
}
</style>