import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AboutPage } from '@/features/about/AboutPage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { RequireLandfillAccess } from '@/features/auth/RequireLandfillAccess'
import { RequirePermission } from '@/features/auth/RequirePermission'
import { CarrierPage } from '@/features/carriers/CarrierPage'
import { CarriersPage } from '@/features/carriers/CarriersPage'
import { LandfillPage } from '@/features/landfills/LandfillPage'
import { LandfillsPage } from '@/features/landfills/LandfillsPage'
import { SendingPipelinePage } from '@/features/reports/pipeline/SendingPipelinePage'
import { ReportPage } from '@/features/reports/ReportPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SendingPage } from '@/features/sending/SendingPage'
import { UserPage } from '@/features/users/UserPage'
import { UsersPage } from '@/features/users/UsersPage'
import { VehiclePage } from '@/features/vehicles/VehiclePage'
import { VehiclesPage } from '@/features/vehicles/VehiclesPage'
import { WasteTypePage } from '@/features/waste-types/WasteTypePage'
import { WasteTypesPage } from '@/features/waste-types/WasteTypesPage'
import { AppLayout } from '@/widgets/layout/AppLayout'
import { NotFoundPage } from './NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/about', element: <AboutPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/reports" replace /> },
          { path: 'reports', element: <ReportsPage /> },
          {
            // Подразделы проверяющих: очередь проверки и отправка в ФГИС УТКО.
            // key: разделы не делят состояние (раскрытые строки, выделение)
            element: <RequirePermission permission="reports.review" />,
            children: [
              { path: 'reports/review', element: <ReportsPage key="review" review /> },
              { path: 'reports/sending', element: <SendingPipelinePage /> },
            ],
          },
          { path: 'reports/:id', element: <ReportPage /> },
          { path: 'carriers', element: <CarriersPage /> },
          { path: 'carriers/:id', element: <CarrierPage /> },
          { path: 'vehicles', element: <VehiclesPage /> },
          { path: 'vehicles/:id', element: <VehiclePage /> },
          { path: 'waste-types', element: <WasteTypesPage /> },
          { path: 'waste-types/:id', element: <WasteTypePage /> },
          {
            element: <RequirePermission permission="landfills.view" />,
            children: [{ path: 'landfills', element: <LandfillsPage /> }],
          },
          {
            element: <RequireLandfillAccess />,
            children: [{ path: 'landfills/:id', element: <LandfillPage /> }],
          },
          {
            element: <RequirePermission permission="analytics.view" />,
            children: [{ path: 'analytics', element: <AnalyticsPage /> }],
          },
          {
            element: <RequirePermission permission="sending.manage" />,
            children: [{ path: 'sending', element: <SendingPage /> }],
          },
          {
            element: <RequirePermission permission="users.view" />,
            children: [
              { path: 'users', element: <UsersPage /> },
              { path: 'users/:id', element: <UserPage /> },
            ],
          },
          // Неизвестный адрес; без входа RequireAuth сначала отправит на /login
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
