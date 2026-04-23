import * as React from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const setRangeAndClose = (range: DateRange | undefined) => {
    onChange(range);
  };

  const setFixedRange = (daysOffset: number, type: 'days' | 'month' = 'days') => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    if (type === 'days') {
      to = today;
      from = subDays(today, daysOffset);
    } else if (type === 'month') {
      const targetMonth = subMonths(today, daysOffset);
      from = startOfMonth(targetMonth);
      to = endOfMonth(targetMonth);
    }
    
    onChange({ from, to });
    setIsOpen(false);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd 'de' MMM, yyyy", { locale: ptBR })} -{' '}
                  {format(value.to, "dd 'de' MMM, yyyy", { locale: ptBR })}
                </>
              ) : (
                format(value.from, "dd 'de' MMM, yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-[#1f1f1f] bg-[#141414] z-[9999]" align="end">
          <div className="flex flex-col md:flex-row">
            {/* Quick selectors */}
            <div className="flex flex-col gap-1 border-r border-border p-4 w-40">
              <Button variant="ghost" className="justify-start" onClick={() => setFixedRange(0)}>
                Hoje
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => setFixedRange(7)}>
                Últimos 7 dias
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => setFixedRange(30)}>
                Últimos 30 dias
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => setFixedRange(0, 'month')}>
                Este mês
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => setFixedRange(1, 'month')}>
                Mês passado
              </Button>
            </div>
            {/* Calendar */}
            <div className="p-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={setRangeAndClose}
                numberOfMonths={2}
                locale={ptBR}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
