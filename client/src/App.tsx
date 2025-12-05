// useRoutes 是一个勾子用来渲染路由配置
import { useRoutes } from 'react-router-dom'

// Toaster 是一个组件，用于显示 toast 消息
import { Toaster } from '@/components/ui/toaster'

// routes 是路由配置数组
import routes from '@/router'

function App() {

  // useRoutes 会根据路由配置渲染对应的组件
  const element = useRoutes(routes)
  
  return (
    <>
      {element}
      <Toaster />
    </>
  )
}

export default App
