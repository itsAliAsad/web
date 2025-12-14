"use client"

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

const data = [
    { name: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Feb", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Apr", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "May", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
]

export function EarningsChart() {
    const total = data.reduce((acc, curr) => acc + curr.total, 0)

    return (
        <Card className="glass-card border-none shadow-glow-teal h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Earnings</CardTitle>
                        <CardDescription className="text-sm">Your 6-month overview</CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-teal-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>+18%</span>
                    </div>
                </div>
                <div className="pt-2">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                        PKR {total.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">total</span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0 pb-4 px-2 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="oklch(0.58 0.14 190)" stopOpacity={0.4} />
                                <stop offset="50%" stopColor="oklch(0.58 0.14 190)" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="oklch(0.58 0.14 190)" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="oklch(0.55 0.13 195)" />
                                <stop offset="50%" stopColor="oklch(0.58 0.14 190)" />
                                <stop offset="100%" stopColor="oklch(0.72 0.19 45)" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(0,0,0,0.04)"
                        />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            width={35}
                        />
                        <Tooltip
                            cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-xl bg-white/95 backdrop-blur-xl p-4 shadow-xl border border-white/50 ring-1 ring-black/5">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                                {payload[0].payload.name}
                                            </p>
                                            <p className="text-2xl font-bold text-foreground">
                                                PKR {Number(payload[0].value).toLocaleString()}
                                            </p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="url(#lineGradient)"
                            strokeWidth={3}
                            fill="url(#areaGradient)"
                            dot={{
                                r: 4,
                                fill: 'white',
                                stroke: 'oklch(0.58 0.14 190)',
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 6,
                                fill: 'oklch(0.58 0.14 190)',
                                stroke: 'white',
                                strokeWidth: 3,
                                className: 'drop-shadow-lg'
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
