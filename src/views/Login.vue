<template>
  <div class="login-container">
    <el-card class="box-card">
      <h2>TaskFlow 登录</h2>
      <el-form :model="form" label-width="80px" @keyup.enter="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-button type="primary" @click="handleLogin" style="width:100%">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '../api/client';
import { useRouter } from 'vue-router';

const router = useRouter();
const form = ref({ username: '', password: '' });

const handleLogin = async () => {
  const res: any = await api.post('/login', form.value);
  // 保存角色信息
  localStorage.setItem('userRole', res.role || 'user');
  router.push('/');
};
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; }
.box-card { width: 400px; }
</style>