npx
create - next - app
liirat - next--
ts--
eslint--
tailwind
\
cd liirat-next
npx shadcn
@latest
init - d
\
npm i
@tanstack
;/ --aaabcceeegghhhiillrrstttttw
\
Pages you need
bash

app/
  (site)/layout.tsx         # Neumorphic shell
  (site)/page.tsx           # Dashboard (quick markets + alerts)
  economic/page.tsx         # Economic News (table)
  financial/page.tsx        # Financial News (table)
  markets/page.tsx          # Charts (Lightweight) + AI controls
  ai/page.tsx               # Your AI agent
api/
  eodhd/economic/route.ts   # proxy to your calendar feed
  eodhd/financial/route.ts  # proxy to your news feed
\
  eodhd/ohlcv/route.ts      # OHLCV
for charts
\
  eodhd/realtime/route.ts   #
last
price
\
  alerts/route.ts           # CRUD alerts
Neumorphic shell (excerpt)
tsx
Copy
Edit
// app/(site)/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0f14] text-slate-200">
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <header className="text-xl font-semibold">LIIRAT</header>
          <main className="space-y-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
// neumorphic panel class you’ll reuse:
export const panel =
  "rounded-2xl border border-white/5 bg-white/[.02] shadow-[inset_6px_6px_12px_rgba(0,0,0,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.03)]"
\
Economic & Financial tables (brandless, your data)
tsx
Copy
Edit
// components/DataTable.tsx
'use client'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import type React from "react"

export type Row = Record<string, any>
export function DataTable({ columns, data }: { columns: ColumnDef<Row, any>[]; data: Row[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5">
      <table className="w-full text-sm">
        <thead className="bg-white/5">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-3 py-2 text-left text-slate-300">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="odd:bg-white/[.02]">
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="px-3 py-2">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
tsx
Copy
Edit
// app/economic/page.tsx
import { DataTable, type Row } from "@/components/DataTable"
import { panel } from "../(site)/layout"
export default async function Page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/eodhd/economic`, { cache: 'no-store' })
  const { items }:{ items: Row[] } = await res.json()
  const columns = [
    { accessorKey:'time', header:'Time' },
    { accessorKey:'country', header:'Country' },
    { accessorKey:'event', header:'Event' },
    { accessorKey:'actual', header:'Actual' },
    { accessorKey:'forecast', header:'Forecast' },
    { accessorKey:'previous', header:'Previous' },
    { accessorKey:'impact', header:'Impact' },
  ] satisfies any
  return (<div className={panel}><div className="p-4"><DataTable columns={columns} data={items} /></div></div>)
}
tsx
Copy
Edit
// app/financial/page.tsx
import { DataTable, type Row } from "@/components/DataTable"
import { panel } from "../(site)/layout"
export default async function Page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/eodhd/financial`, { cache: 'no-store' })
  const { items }:{ items: Row[] } = await res.json()
  const columns = [
    { accessorKey:'ts', header:'Time' },
    { accessorKey:'source', header:'Source' },
    { accessorKey:'headline', header:'Headline' },
    { accessorKey:'symbol', header:'Symbol' },
    { accessorKey:'sentiment', header:'Sentiment' },
  ] satisfies any
  return (<div className={panel}><div className="p-4"><DataTable columns={columns} data={items} /></div></div>)
}
\
Markets page
with Lightweight-Charts (AI-controllable)
\
tsx
Copy
Edit
// app/markets/page.tsx
'use client'
import { createChart, LineStyle } from "lightweight-charts"
import { useEffect, useRef } from "react"
import { panel } from "../(site)/layout"

export default function Markets() {
  const ref = useRef<HTMLDivElement|null>(null)
  useEffect(()=> {
    if (!ref.current) return
    const chart = createChart(ref.current, {
      autoSize:true, layout:{ background:{ color:'transparent' }, textColor:'#9ca3af' },
      grid:{ vertLines:{ color:'#1f2937' }, horzLines:{ color:'#1f2937' } },
    })
    const series = chart.addCandlestickSeries({ upColor:'#16a34a', downColor:'#ef4444', borderVisible:false, wickUpColor:'#16a34a', wickDownColor:'#ef4444' })
    ;(async ()=>{
      const r = await fetch('/api/eodhd/ohlcv?symbol=XAUUSD&tf=15m&lookback=500'); const j = await r.json()
      series.setData(j.ohlcv.map((b:any)=>({ time:b.ts, open:b.o, high:b.h, low:b.l, close:b.c })))
    })()
    ;(window as any).ChartAPI = {
      addLevel:(p:number,t?:string)=> chart.addHorizontalLine(p,{ lineStyle:LineStyle.Dashed, lineWidth:1, color:'#f59e0b', axisLabelVisible:true, title:t||`Level ${p}` })
    }
    const ro = new ResizeObserver(()=>chart.applyOptions({})); ro.observe(ref.current)
    return ()=>{ ro.disconnect(); chart.remove() }
  },[])
  return (<div className={panel}><div className="h-[540px]" ref={ref}/></div>)
}
\
Brandless EODHD proxies (no guessing—just pass through)
Set env: EODHD_API_TOKEN=...

ts
Copy
Edit
// app/api/eodhd/ohlcv/route.ts
export const dynamic = "force-dynamic"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "XAUUSD").toUpperCase()
  const tf = searchParams.get("tf") || "15m"
  const lookback = Number(searchParams.get("lookback") || 500)
  const token = process.env.EODHD_API_TOKEN
  if (!token) return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  // You already know your exact EODHD endpoints. Call them here:
  const url = `${process.env.EODHD_BASE}/intraday/${symbol}?period=${tf.replace("m", "")}m&limit=${lookback}&api_token=${token}&fmt=json`
  const r = await fetch(url, { cache: "no-store" })
  const rows = await r.json()
  const ohlcv = rows.map((b: any) => ({
    ts: Math.floor(new Date(b.datetime).getTime() / 1000),
    o: +b.open,
    h: +b.high,
    l: +b.low,
    c: +b.close,
  }))
  return Response.json({ symbol, tf, ohlcv })
}
ts
Copy
Edit
// app/api/eodhd/economic/route.ts
export const dynamic = "force-dynamic"
export async function GET() {
  const token = process.env.EODHD_API_TOKEN
  if (!token) return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  const url = `${process.env.EODHD_BASE}/economic-events?api_token=${token}&fmt=json` // <-- put your exact path
  const r = await fetch(url, { cache: "no-store" })
  const items = await r.json()
  return Response.json({ items })
}
ts
Copy
Edit
// app/api/eodhd/financial/route.ts
export const dynamic = "force-dynamic"
export async function GET() {
  const token = process.env.EODHD_API_TOKEN
  if (!token) return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  const url = `${process.env.EODHD_BASE}/news?api_token=${token}&fmt=json` // <-- put your exact path
  const r = await fetch(url, { cache: "no-store" })
  const items = await r.json()
  return Response.json({ items })
}
ts
Copy
Edit
// app/api/eodhd/realtime/route.ts
export const dynamic = "force-dynamic"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "XAUUSD").toUpperCase()
  const token = process.env.EODHD_API_TOKEN
  const url = `${process.env.EODHD_BASE}/real-time/${symbol}?api_token=${token}&fmt=json`
  const r = await fetch(url, { cache: "no-store" })
  const j = await r.json()
  return Response.json({
    symbol,
    price: +j.close,
    ts: Math.floor(new Date(j.timestamp || Date.now()).getTime() / 1000),
  })
}
Alerts(minimal)
Table: alerts(id, user, type["price" | "event"], symbol, condition, channel, status, created_at)

\
Cron (Vercel/your runner): every 1–5 min, query conditions vs. latest price/events
insert
notification
update
status.

\
UI: page listing alerts + create form
toast
on
trigger.

\
Outcome: Brandless, modern, Liirat-styled site
with Economic News, Financial
News, Markets(AI - controllable), and
Alerts, all
powered
by
your
EODHD
All - In - One
