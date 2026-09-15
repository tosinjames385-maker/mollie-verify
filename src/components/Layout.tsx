import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export const Layout = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-[68px]">
        <Outlet />
      </main>
    </div>
  )
}
