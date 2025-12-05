// 使用 React 18新增的createRoot API 来替代传统的ReactDOM.render
import { createRoot } from 'react-dom/client'

import {BrowserRouter as Router} from 'react-router-dom'

// QueryClient 就像一个数据中心，负责管理查询和缓存，管理请求状态（loading。error，success）,处理数据更新和失效
// QueryClientProvider 让所有组件都能访问到QueryClient
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// 创建QueryClient实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})


// createRoot会启用并发渲染，也就是可以随时中断渲染，优先处理更重要的更新保持交互流程
// 传统的ReactDom.render是同步渲染，一旦开始就必须完成，渲染过程中还会阻塞浏览器，交互会卡顿

const root = createRoot(document.getElementById("root")!);

root.render(
    <QueryClientProvider client={queryClient}>
      <Router>
        <App />
      </Router>
    </QueryClientProvider>
)
