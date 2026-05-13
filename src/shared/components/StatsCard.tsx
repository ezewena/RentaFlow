import { cn } from '@/shared/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  iconClassName?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={cn('p-3 rounded-xl', iconClassName ?? 'bg-brand-50')}>
        <Icon className={cn('w-5 h-5', iconClassName ? 'text-current' : 'text-brand-600')} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
