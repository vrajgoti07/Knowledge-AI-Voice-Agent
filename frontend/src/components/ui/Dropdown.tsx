// ============================================================
// Shared UI Component — Dropdown Menu
// ============================================================

import React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/utils'

export interface DropdownItemDef {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  danger?: boolean
  onClick?: () => void
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItemDef[]
  align?: 'start' | 'center' | 'end'
}

export function Dropdown({ trigger, items, align = 'end' }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className="z-50 min-w-[180px] p-1.5 rounded-xl bg-bg-primary border border-border shadow-md animate-fade-in outline-none"
        >
          {items.map((item) => {
            const Icon = item.icon
            return (
              <DropdownMenu.Item
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer outline-none transition-colors',
                  item.danger
                    ? 'text-danger hover:bg-red-50'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{item.label}</span>
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
