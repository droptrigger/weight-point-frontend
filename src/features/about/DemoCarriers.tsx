import { ChevronRight } from 'lucide-react'
import { formatKg, formatNumber, plural } from '@/shared/lib/format'
import { ShareRing } from '@/shared/ui/ShareRing'
import { DEMO_CARRIERS } from './demoData'

const VEHICLE_FORMS: [string, string, string] = ['машина', 'машины', 'машин']

type Props = {
  onOpen: (carrier: string) => void // открыть машины перевозчика
}

// Перевозчики полигона: доля каждого в весе отходов за месяц, как на странице перевозчика
export function DemoCarriers({ onOpen }: Props) {
  return (
    <div className="demo-carriers">
      <div className="demo-page-head">
        <div>
          <h3>Перевозчики</h3>
          <span className="demo-page-sub">Доля в весе отходов полигона за месяц</span>
        </div>
      </div>

      <div className="demo-carrier-grid">
        {DEMO_CARRIERS.map((c) => (
          // Карточка кликабельна целиком: кнопка на названии растянута на неё через ::after
          <div key={c.name} className="demo-carrier">
            <div className="demo-carrier-head">
              <button
                type="button"
                className="demo-open demo-carrier-name"
                aria-label={`${c.name}: машины перевозчика`}
                onClick={() => onOpen(c.name)}
              >
                {c.name}
              </button>
              <span className="demo-carrier-more">
                {plural(c.vehicles, VEHICLE_FORMS)}
                <ChevronRight className="icon" />
              </span>
            </div>
            <ShareRing percent={c.sharePercent} label="веса отходов полигона" />
            <div className="demo-carrier-stats">
              <span>
                Отчётов <strong>{formatNumber(c.monthReports)}</strong>
              </span>
              <span>
                Вес <strong>{formatKg(c.monthNettoKg)}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
