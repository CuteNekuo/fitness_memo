import { Link, useLocation } from 'react-router-dom'
import { toDateKey, today } from '../../lib/date'

export function BottomNav() {
  const { pathname } = useLocation()
  const todayKey = toDateKey(today())

  const tabs = [
    { label: '今日', to: `/day/${todayKey}`, match: '/day' },
    { label: '週', to: '/week', match: '/week' },
    { label: 'グラフ', to: '/chart', match: '/chart' },
    { label: '設定', to: '/settings', match: '/settings' },
  ]

  return (
    <div className="flex border-t border-neutral-800 bg-black">
      {tabs.map(tab => {
        const active = pathname.startsWith(tab.match)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex-1 py-3 text-center text-xs transition-colors ${
              active ? 'text-white font-bold' : 'text-neutral-500'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
