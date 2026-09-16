import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export const Layout = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-[44px] lg:pt-[48px]">
        <Outlet />
      </main>
    </div>
  )
}
