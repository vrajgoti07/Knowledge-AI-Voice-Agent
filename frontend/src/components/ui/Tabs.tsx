// ============================================================
// Shared UI Component — Tabs
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface TabItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  count?: number
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'pills' | 'underline'
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn('inline-flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10', className)}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer outline-none select-none',
                isActive
                  ? 'bg-[#3B82F6] text-white shadow-sm shadow-blue-500/20'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04]'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={cn(
                  'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-[#94A3B8]'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1 border-b border-white/10', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px outline-none cursor-pointer select-none',
              isActive
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:border-white/20'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={cn(
                'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold',
                isActive ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-white/10 text-[#94A3B8]'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
