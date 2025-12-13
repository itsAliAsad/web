"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
    { name: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Feb", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Apr", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "May", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
]

export function EarningsChart() {
    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Your Earnings</CardTitle>
                <CardDescription>Monthly earnings for the current year.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={{
                    total: {
                        label: "Earnings",
                        color: "var(--chart-1)",
                    },
                }} className="h-[350px] w-full">
                    <BarChart data={data}>
                        <defs>
                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent indicator="line" className="glass-card border-white/20" />}
                            cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                        />
                        <Bar dataKey="total" fill="url(#colorEarnings)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
