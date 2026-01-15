import axios from 'axios';
import { ElMessage } from 'element-plus';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
});

api.interceptors.response.use(
  res => res.data,
  err => {
    // 忽略部分特定错误避免刷屏
    if (err.response?.config?.url !== '/login') {
        ElMessage.error(err.response?.data?.error || '请求失败');
    }

    if (err.response?.status === 401) {
      // 关键修改：这里必须加 /#/，因为你是 Hash 模式
      window.location.href = '/#/login'; 
    }
    return Promise.reject(err);
  }
);

export default api;