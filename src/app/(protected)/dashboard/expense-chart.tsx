"use client"

import * as React from "react"
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"

const data = [
  { name: "Software", value: 400, color: "hsl(var(--chart-1))" },
  { name: "Marketing", value: 300, color: "hsl(var(--chart-2))" },
  { name: "Salaries", value: 300, color: "hsl(var(--chart-3))" },
  { name: "Office", value: 200, color: "hsl(var(--chart-4))" },
]

export default function ExpenseChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Tooltip
          cursor={false}
          contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))'
          }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          innerRadius={80}
          paddingAngle={5}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
