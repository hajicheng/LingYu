import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import LibraryPage from '@/pages/LibraryPage'
import ProgressPage from '@/pages/ProgressPage'
import ReviewPage from '@/pages/ReviewPage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="review" element={<ReviewPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
