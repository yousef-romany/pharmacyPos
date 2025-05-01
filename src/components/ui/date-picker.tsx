
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { arSA } from 'date-fns/locale'; // Import Arabic locale

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    buttonClassName?: string;
    buttonContent?: React.ReactNode; // Optional: Content to show when no date is selected
}

export function DatePicker({ date, setDate, buttonClassName, buttonContent }: DatePickerProps) {

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
             buttonClassName // Allow passing custom classes to the button
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
           {date ? format(date, "PPP", { locale: arSA }) : (buttonContent || <span>اختر تاريخ</span>)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
           locale={arSA} // Use Arabic locale for the calendar
        />
      </PopoverContent>
    </Popover>
  )
}
