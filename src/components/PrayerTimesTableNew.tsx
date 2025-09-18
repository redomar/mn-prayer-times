"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, Download } from "lucide-react"
import { timetable } from "@/app/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PrayerTimesTableProps {
  times: timetable.PrayerTimes[]
}

function formatMonthYear(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  })
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function formatTime(timeString: string | null): string {
  if (!timeString) return "-"
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const columns: ColumnDef<timetable.PrayerTimes>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-primary/10"
        >
          Date
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{formatDate(row.getValue("date"))}</div>
    ),
  },
  {
    accessorKey: "fajr",
    header: "Fajr",
    cell: ({ row }) => (
      <div className="text-center">{formatTime(row.getValue("fajr"))}</div>
    ),
  },
  {
    accessorKey: "sunrise",
    header: "Sunrise",
    cell: ({ row }) => (
      <div className="text-center">{formatTime(row.getValue("sunrise"))}</div>
    ),
  },
  {
    accessorKey: "dhuhr",
    header: "Dhuhr",
    cell: ({ row }) => (
      <div className="text-center">{formatTime(row.getValue("dhuhr"))}</div>
    ),
  },
  {
    accessorKey: "asr",
    header: "Asr",
    cell: ({ row }) => (
      <div className="text-center">{formatTime(row.getValue("asr"))}</div>
    ),
  },
  {
    accessorKey: "maghrib",
    header: "Maghrib",
    cell: ({ row }) => (
      <div className="text-center">{formatTime(row.getValue("maghrib"))}</div>
    ),
  },
  {
    accessorKey: "isha",
    header: "Isha",
    cell: ({ row }) => (
      <div className="text-center">{formatTime(row.getValue("isha"))}</div>
    ),
  },
]

export function PrayerTimesTableNew({ times }: PrayerTimesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data: times,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  if (times.length === 0) {
    return (
      <Card className="glass w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No prayer times available</p>
        </CardContent>
      </Card>
    )
  }

  const timesByMonth: Record<string, timetable.PrayerTimes[]> = {}
  for (const t of times) {
    const key = formatMonthYear(t.date)
    timesByMonth[key] = timesByMonth[key] || []
    timesByMonth[key].push(t)
  }

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      <Card className="glass">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Prayer Times - {times[0]?.location?.name ?? "Unknown location"}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        {Object.entries(timesByMonth).map(([monthYear]) => (
          <Button
            key={monthYear}
            variant="outline"
            size="sm"
            className="glass hover:glass-strong transition-all duration-300"
          >
            <Download className="mr-2 h-4 w-4" />
            {monthYear}
          </Button>
        ))}
      </div>

      <Card className="glass-strong overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border/30">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border/20 hover:bg-primary/5 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}