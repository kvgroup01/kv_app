"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(
    () => {
      if (!value) return undefined;
      const from = value.from ? new Date(value.from) : undefined;
      const to = value.to ? new Date(value.to) : undefined;
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(0, 0, 0, 0);
      return { from, to };
    },
  );
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" && window.innerWidth < 768,
  );

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const hoje = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const presets = [
    {
      label: "Hoje",
      range: { from: hoje(), to: hoje() },
    },
    {
      label: "Últimos 7 dias",
      range: { from: subDays(hoje(), 6), to: hoje() },
    },
    {
      label: "Últimos 30 dias",
      range: { from: subDays(hoje(), 29), to: hoje() },
    },
    {
      label: "Este mês",
      range: { from: startOfMonth(hoje()), to: hoje() },
    },
    {
      label: "Mês passado",
      range: {
        from: startOfMonth(subMonths(hoje(), 1)),
        to: endOfMonth(subMonths(hoje(), 1)),
      },
    },
    {
      label: "Máximo",
      range: { from: new Date(2000, 0, 1), to: hoje() },
    },
  ];

  function handlePreset(range: DateRange) {
    onChange(range);
    setTempRange(range);
    setOpen(false);
  }

  function handleApply() {
    onChange(tempRange);
    setOpen(false);
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
            className,
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
        className="w-auto p-0 max-h-[90vh] overflow-y-auto"
        align="end"
      >
        <div className="flex">
          <div className="hidden md:flex flex-col gap-1 border-r p-3 min-w-[130px]">
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
              modifiersClassNames={{
                today: "font-normal",
              }}
              classNames={{
                day_today: "font-normal",
              }}
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
              <Button type="button" size="sm" onClick={handleApply}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
