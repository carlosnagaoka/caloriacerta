import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Padding inferior para não ficar atrás da nav */}
      <div className="pb-20">
        {children}
      </div>
      <BottomNav />
    </>
  )
}
