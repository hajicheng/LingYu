/**
 * 认证页面布局组件
 * 用于登录、注册、忘记密码等页面
 */
import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Outlet />
    </div>
  )
}

export default AuthLayout
