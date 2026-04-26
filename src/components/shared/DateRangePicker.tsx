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
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    handler()
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
        className={cn(
          "p-0 bg-background z-50",
          isMobile 
            ? "!fixed !bottom-0 !left-0 !right-0 !top-auto !w-full !max-w-none !translate-x-0 !translate-y-0 rounded-t-xl rounded-b-none border-x-0 border-b-0 shadow-2xl" 
            : "w-auto"
        )} 
        align="start"
      >
        <div className="flex flex-col max-h-[80vh] md:max-h-none">
          <div className="flex flex-col md:flex-row overflow-y-auto">
            <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r p-3 min-w-[130px]">
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
                numberOfMonths={isMobile ? 1 : 2}
                locale={ptBR}
                className="mx-auto"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-3 border-t bg-background shrink-0 mt-auto">
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
      </PopoverContent>
    </Popover>
  )
}
