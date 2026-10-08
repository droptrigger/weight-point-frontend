import { http, type Paged } from '@/shared/api/http'

type Ref<Id> = { id: Id; name: string }

// Бизнес-статус отчёта на сервере (справочник report_statuses)
export type ReportStatusCode =
  | 'awaiting_sync' // данные пришли с телефона, фото ещё нет
  | 'awaiting_review'
  | 'rejected'
  | 'accepted' // принят, отправка в ФГИС УТКО для вида отхода не нужна
  | 'awaiting_sending' // принят и ждёт отправки в ФГИС УТКО
  | 'sending' // уходит в ФГИС УТКО прямо сейчас: отчёт не меняется, пока не придёт ответ
  | 'sent'
  | 'sending_failed' // текст ошибки — в комментарии последней записи истории статусов
export type ReportStatus = { code: ReportStatusCode; name: string }

// Статусы, которые проверяющий ставит вручную. «accepted» сервер превращает в «Принят»
// или «Ожидает отправки» по виду отхода; «awaiting_review» возвращает отклонённый отчёт на проверку,
// «awaiting_sending» повторяет отправку после ошибки
export type ReviewStatusCode = 'accepted' | 'rejected' | 'awaiting_review' | 'awaiting_sending'

// Откуда создан отчёт: 1 — мобильное приложение (офлайн, фото догружаются), 2 — веб-интерфейс
export type ReportSource = 1 | 2

// Массовая смена статуса: неподходящие отчёты сервер пропускает и объясняет почему
// Итоговый статус у разных отчётов может отличаться, поэтому он приходит для каждого
export type StatusChangeResult = {
  updated: { reportId: string; status: ReportStatus }[]
  skipped: { reportId: string; reason: string }[]
}

// Ручная отправка: отчёты сразу становятся «Отправляется» и уходят в фоне, итог каждого приходит через SignalR
export type SendResult = {
  queued: string[] // в порядке отправки
  skipped: { reportId: string; reason: string }[]
}

// Всё, что ждёт отправки, или повтор всех ошибок
export type SendAllStatus = Extract<ReportStatusCode, 'awaiting_sending' | 'sending_failed'>

// Запись истории статусов. changedBy: null — статус сменила система (например, выгрузка в ФГИС УТКО)
export type ReportStatusHistoryItem = {
  id: string
  status: ReportStatus
  changedAt: string
  changedBy: ReportUser | null
  comment: string | null // причина отклонения, текст ошибки отправки и т.п.
}

export type ReportBrief = {
  id: string
  plateNumber: string
  regionCode: string
  landfillName: string
  // Вид отхода; requiresSending: false — отчёт не выгружается в ФГИС УТКО
  wasteType: { name: string; code: string; requiresSending: boolean } | null
  weightBruttoKg: number | null
  weightTaraKg: number | null
  weightNettoKg: number | null
  createdAt: string
  syncedAt: string | null // момент приёма отчёта сервером
  sentAt: string | null // момент отправки в ФГИС УТКО
  status: ReportStatus
  statusComment: string | null // причина отклонения или текст ошибки отправки
  source: ReportSource
  updatedAt: string
}

export type PhotoTypeCode = 'vehicle' | 'brutto' | 'tara'

export type ReportPhoto = {
  id: string
  reportId: string
  photoType: { code: PhotoTypeCode; name: string }
  downloadUrl: string | null
  uploadedAt: string | null
}

type ReportUser = {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string | null
}

export type ReportDetails = {
  id: string
  vehicle: {
    id: string
    plateNumber: string
    regionCode: string
    make: Ref<string> | null
    carrier: Ref<string> | null
  }
  landfill: Ref<string> & { latitude: number; longitude: number }
  user: ReportUser
  wasteType: (Ref<string> & { code: string }) | null
  weightBruttoKg: number | null
  weightTaraKg: number | null
  weightNettoKg: number | null // null, пока не известны оба веса
  bruttoAt: string | null
  taraAt: string | null
  createdAt: string
  syncedAt: string | null
  sentAt: string | null
  status: ReportStatus
  source: ReportSource
  updatedAt: string
  updatedBy: ReportUser | null // кто последним правил отчёт; null — не редактировался
  version: number // передаётся при сохранении: защита от одновременной правки
  photos: ReportPhoto[]
}

// Поля отчёта, общие для создания и редактирования
export type ReportInput = {
  vehicleId: string
  wasteTypeId: string | null
  weightBruttoKg: number | null
  weightTaraKg: number | null
  bruttoAt: string | null
  taraAt: string | null
}

// Дату создания можно задать только при создании через веб, как это делает мобильное приложение
export type ReportCreate = ReportInput & {
  createdAt: string
}

export type ReportUpdate = ReportInput & {
  version: number
  landfillId?: string // перенос в другой полигон, только у разработчика
}

// При создании через веб все три фото обязательны и уходят в том же запросе
export type ReportPhotos = Record<PhotoTypeCode, File>

export type ReportParams = {
  page: number
  pageSize: number
  search?: string
  landfillId?: string
  vehicleId?: string
  from?: string
  to?: string
  status?: ReportStatusCode
  sort?: ReportSort
}

// По умолчанию новые сверху. createdAt — очередь отправки (старые сверху), -sentAt — недавно отправленные,
// -updatedAt — недавно изменённые (последние ошибки отправки)
export type ReportSort = 'createdAt' | '-createdAt' | '-sentAt' | '-updatedAt'

export type ReportAnalytics = {
  totalReportsCount: number
  todayReportsCount: number
  monthReportsCount: number
  monthAverageNettoKg: number | null // null, если за месяц отчётов нет
}

export const reportsApi = {
  list: (p: ReportParams) => http.get<Paged<ReportBrief>>('/report', p),
  get: (id: string) => http.get<ReportDetails>(`/report/${id}`),
  // Без landfillId — по всем отчётам (доступно только разработчику)
  analytics: (landfillId?: string) =>
    http.get<ReportAnalytics>('/report/analytics', { LandfillId: landfillId }),
  changeStatus: (reportIds: string[], status: ReviewStatusCode, comment?: string) =>
    http.patch<StatusChangeResult>('/report/status', { reportIds, status, comment }),
  send: (reportIds: string[]) => http.post<SendResult>('/report/send', { reportIds }),
  // landfillId нужен только разработчику, остальные отправляют отчёты своего полигона
  sendAll: (status: SendAllStatus, landfillId?: string) =>
    http.post<SendResult>('/report/send-all', { status, landfillId }),
  // От старых записей к новым
  statusHistory: (id: string) =>
    http.get<ReportStatusHistoryItem[]>(`/report/${id}/status-history`),
  // Создание через веб-интерфейс: отчёт создаётся в полигоне текущего пользователя
  create: (d: ReportCreate, photos: ReportPhotos) => {
    const body = new FormData()
    for (const [key, value] of Object.entries(d)) {
      if (value !== null) body.append(key, String(value))
    }
    body.append('vehiclePhoto', photos.vehicle)
    body.append('bruttoPhoto', photos.brutto)
    body.append('taraPhoto', photos.tara)
    return http.post<ReportDetails>('/report/web', body)
  },
  update: (id: string, d: ReportUpdate) => http.put<ReportDetails>(`/report/${id}`, { id, ...d }),
  // Безвозвратно, вместе с фото. Отправленный в ФГИС УТКО отчёт сервер удалить не даст
  remove: (id: string) => http.delete(`/report/${id}`),
  // Только фото отчёта, без остальных данных. Путь во множественном числе, как у замены фото
  photos: (reportId: string) => http.get<ReportPhoto[]>(`/reports/${reportId}/photos`),
  replacePhoto: (reportId: string, photoId: string, file: File) => {
    const body = new FormData()
    body.append('image', file)
    return http.put<ReportPhoto>(`/reports/${reportId}/photos/${photoId}`, body)
  },
}
