import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Setup from '../views/Setup.vue'
import Layout from '../views/Layout.vue'


import AllTasksView from '../views/AllTasksView.vue'

import UserManagement from '../views/UserManagement.vue'
import WorkDashboard from '../views/WorkDashboard.vue'

const routes = [
  { path: '/login', component: Login },
  { path: '/setup', component: Setup },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        redirect: () => {
          const role = localStorage.getItem('userRole')
          return role === 'admin' ? '/admin/users' : '/tasks/todo'
        }
      },
  
      // 新增路由
   
      { path: 'all-tasks', component: AllTasksView },
   
      { path: 'dashboard', component: WorkDashboard },
      { path: 'admin/users', component: UserManagement }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：检查系统初始化状态
router.beforeEach(async (to, _from, next) => {
  // 如果是去 setup 或 login 页面，直接放行
  if (to.path === '/setup' || to.path === '/login') {
    next()
    return
  }

  try {
    // 检查系统是否已初始化
    const res = await fetch('/api/init-status')
    const data = await res.json()

    if (!data.initialized) {
      // 系统未初始化，跳转到 setup
      next('/setup')
    } else {
      // 系统已初始化，继续正常路由
      next()
    }
  } catch (error) {
    // 如果检查失败，放行（让后续的认证中间件处理）
    next()
  }
})

export default router