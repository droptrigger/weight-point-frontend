import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/http'
import {
  reportsApi,
  type ReportCreate,
  type ReportParams,
  type ReportPhotos,
  type ReportUpdate,
  type ReviewStatusCode,
} from './api'

const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (p: ReportParams) => [...reportKeys.lists(), p] as const,
  one: (id: string) => [...reportKeys.all, 'one', id] as const,
  // Внутри ключа отчёта: всё, что сбрасывает отчёт (правка, замена фото), сбрасывает и его фото
  photos: (id: string) => [...reportKeys.one(id), 'photos'] as const,
  // Тоже внутри ключа отчёта: смена статуса и правка дописывают историю
  statusHistory: (id: string) => [...reportKeys.one(id), 'status-history'] as const,
  analyticsAll: () => [...reportKeys.all, 'analytics'] as const,
  analytics: (landfillId?: string) => [...reportKeys.analyticsAll(), landfillId] as const,
}

export const useReports = (p: ReportParams) =>
  useQuery({
    queryKey: reportKeys.list(p),
    queryFn: () => reportsApi.list(p),
    placeholderData: keepPreviousData,
  })

export const useReport = (id: string) =>
  useQuery({ queryKey: reportKeys.one(id), queryFn: () => reportsApi.get(id) })

// Соседние отчёты в панели списка грузятся заранее: «следующий» открывается без заглушки
export function usePrefetchReport() {
  const qc = useQueryClient()
  return (id: string) =>
    qc.prefetchQuery({ queryKey: reportKeys.one(id), queryFn: () => reportsApi.get(id) })
}

// Фото для раскрытой строки списка: без остальных данных отчёта
export const useReportPhotos = (id: string) =>
  useQuery({ queryKey: reportKeys.photos(id), queryFn: () => reportsApi.photos(id) })

export const useReportStatusHistory = (id: string) =>
  useQuery({ queryKey: reportKeys.statusHistory(id), queryFn: () => reportsApi.statusHistory(id) })

export const useReportAnalytics = (landfillId?: string) =>
  useQuery({
    queryKey: reportKeys.analytics(landfillId),
    queryFn: () => reportsApi.analytics(landfillId),
    placeholderData: keepPreviousData, // при смене полигона цифры не мигают заглушками
  })

// Статус виден в списке и карточке, поэтому сбрасывается весь кеш отчётов
export function useChangeReportsStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { ids: string[]; status: ReviewStatusCode; comment?: string }) =>
      reportsApi.changeStatus(v.ids, v.status, v.comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.all }),
  })
}

export function useCreateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { data: ReportCreate; photos: ReportPhotos }) =>
      reportsApi.create(v.data, v.photos),
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.all }),
  })
}

export function useUpdateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; data: ReportUpdate }) => reportsApi.update(v.id, v.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.all }),
    // 409: отчёт успели изменить. Для того чтобы после закрытия формы были свежие данные, карточка перезапрашивается
    onError: (error, v) => {
      if (error instanceof ApiError && error.status === 409)
        return qc.invalidateQueries({ queryKey: reportKeys.one(v.id) })
    },
  })
}

export function useReplaceReportPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { reportId: string; photoId: string; file: File }) =>
      reportsApi.replacePhoto(v.reportId, v.photoId, v.file),
    // Замена фото принятого отчёта возвращает его на проверку: меняется и статус
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.all }),
  })
}

export function useDeleteReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reportsApi.remove,
    // Карточка удалённого отчёта не перезапрашивается: со страницы происходит переход
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: reportKeys.lists() }),
        qc.invalidateQueries({ queryKey: reportKeys.analyticsAll() }),
      ]),
  })
}
