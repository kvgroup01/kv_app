"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({ 
  value, 
  onChange, 
  className 
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(value)
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  )

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const presets = [
    { 
      label: "Hoje", 
      range: { from: new Date(), to: new Date() } 
    },
    { 
      label: "Últimos 7 dias", 
      range: { from: subDays(new Date(), 6), to: new Date() } 
    },
    { 
      label: "Últimos 30 dias", 
      range: { from: subDays(new Date(), 29), to: new Date() } 
    },
    { 
      label: "Este mês", 
      range: { from: startOfMonth(new Date()), to: new Date() } 
    },
    { 
      label: "Mês passado", 
      range: { 
        from: startOfMonth(subMonths(new Date(), 1)), 
        to: endOfMonth(subMonths(new Date(), 1)) 
      } 
    },
  ]

  function handlePreset(range: DateRange) {
    onChange(range)
    setTempRange(range)
    setOpen(false)
  }

  function handleApply() {
    onChange(tempRange)
    setOpen(false)
  }

  if (isMobile) {
    return (
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">De:</label>
          <input
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={value?.from ? format(value.from, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              const dateStr = e.target.value;
              const newFrom = dateStr ? new Date(`${dateStr}T12:00:00`) : undefined;
              onChange({ from: newFrom, to: value?.to });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Até:</label>
          <input
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={value?.to ? format(value.to, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              const dateStr = e.target.value;
              const newTo = dateStr ? new Date(`${dateStr}T12:00:00`) : undefined;
              onChange({ from: value?.from, to: newTo });
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "dd 'de' MMM, yyyy", { locale: ptBR })}
                {" - "}
                {format(value.to, "dd 'de' MMM, yyyy", { locale: ptBR })}
              </>
            ) : (
              format(value.from, "dd 'de' MMM, yyyy", { locale: ptBR })
            )
          ) : (
            <span>Selecionar período</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-auto p-0" 
        align="start"
      >
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-3 min-w-[130px]">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start text-sm font-normal"
                onClick={() => handlePreset(preset.range)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempRange?.from}
              selected={tempRange}
              onSelect={setTempRange}
              numberOfMonths={2}
              locale={ptBR}
            />
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
