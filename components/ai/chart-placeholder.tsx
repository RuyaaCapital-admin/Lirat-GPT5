"use client"

import { ModernPanel, ModernPanelContent, ModernPanelHeader, ModernPanelTitle } from "@/components/modern-panel"

export function AiChartPlaceholder() {
  return (
    <ModernPanel className="h-full overflow-hidden border border-slate-200/70 bg-white/95 shadow-xl dark:border-slate-800/60 dark:bg-slate-900/80 flex flex-col">
      <ModernPanelHeader className="shrink-0">
        <ModernPanelTitle>Chart</ModernPanelTitle>
      </ModernPanelHeader>
      <ModernPanelContent className="p-0 flex-1 min-h-0">
        <div className="relative h-full w-full overflow-hidden rounded-b-3xl border-t border-slate-200/70 dark:border-slate-800/60 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Chart temporarily disabled</p>
            <p className="text-xs text-muted-foreground/70">Coming soon</p>
          </div>
        </div>
      </ModernPanelContent>
    </ModernPanel>
  )
}

