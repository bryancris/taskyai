import * as React from 'react'

import LeftSidebar from './_components/left-sidebar'
import RightSidebar from './_components/right-sidebar'
import Navbar from './_components/navbar'
import { LoadingScreen } from '@/components/ui/loading'

import { authenticate } from '@/lib/_actions/authenticate'
import { redirect } from 'next/navigation'
import { ListService } from '@/services/list-service'

import OverlayProvider from '@/components/providers/overlay-provider'

interface PageProps {
  children: React.ReactNode
}

export default async function Layout(props: PageProps) {
  const isAuthenticated = await authenticate()

  if (!isAuthenticated) {
    redirect('/login')
  }

  const lists = await ListService.getLists()

  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <OverlayProvider />
      <div className="flex h-screen overflow-y-hidden overflow-x-hidden">
        <LeftSidebar lists={lists} />
        <div className="flex flex-col flex-1 overflow-y-hidden bg-background">
          <Navbar lists={lists} />
          <div className="overflow-y-auto overflow-x-auto h-full p-4 md:p-8">{props.children}</div>
        </div>
        <RightSidebar />
      </div>
    </React.Suspense>
  )
}
