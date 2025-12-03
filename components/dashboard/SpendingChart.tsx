"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
    { name: "Jan", total: Math.floor(Math.random() * 2000) + 500 },
    { name: "Feb", total: Math.floor(Math.random() * 2000) + 500 },
    { name: "Mar", total: Math.floor(Math.random() * 2000) + 500 },
    { name: "Apr", total: Math.floor(Math.random() * 2000) + 500 },
    { name: "May", total: Math.floor(Math.random() * 2000) + 500 },
    { name: "Jun", total: Math.floor(Math.random() * 2000) + 500 },
]

export function SpendingChart() {
    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Spending Overview</CardTitle>
                <CardDescription>Monthly spending for the current year.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={{
                    total: {
                        label: "Spent",
                        color: "hsl(var(--chart-2))",
                    },
                }} className="h-[200px] w-full">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
