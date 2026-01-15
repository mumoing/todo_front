<template>
  <div class="setup-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>TaskFlow 系统初始化</span>
        </div>
      </template>
      
      <div class="tip">
        <el-alert
          title="欢迎使用 TaskFlow"
          description="检测到这是您第一次运行系统，请设置管理员账号。"
          type="info"
          show-icon
          :closable="false"
        />
      </div>

      <el-form :model="form" label-width="80px" class="setup-form" @keyup.enter="handleSetup">
        <el-form-item label="管理员" required>
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-button type="primary" @click="handleSetup" :loading="loading" style="width:100%">
          完成设置并登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/client';
import { ElMessage } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const form = ref({
  username: '',
  password: ''
});

const handleSetup = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请填写完整的账号和密码');
    return;
  }

  loading.value = true;
  try {
    // 调用后端 setup 接口
    const res: any = await api.post('/setup', form.value);
    // 保存角色信息
    localStorage.setItem('userRole', res.role || 'admin');
    ElMessage.success('初始化成功，自动登录中...');
    router.push('/');
  } catch (error) {
    // 错误处理已在 api client 拦截器中统一处理，这里只需要关闭 loading
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.setup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}
.box-card {
  width: 450px;
}
.card-header {
  font-weight: bold;
  font-size: 18px;
  text-align: center;
}
.tip {
  margin-bottom: 20px;
}
.setup-form {
  margin-top: 20px;
}
</style>