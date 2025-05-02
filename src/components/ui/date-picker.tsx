
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
    // Allow Date, string (from DB/form state), or undefined
    date: Date | string | undefined;
    // Ensure setDate can handle Date or undefined (Calendar returns Date | undefined)
    setDate: (date: Date | undefined) => void;
    buttonClassName?: string;
    buttonContent?: React.ReactNode; // Optional: Content to show when no date is selected
}

export function DatePicker({ date, setDate, buttonClassName, buttonContent }: DatePickerProps) {

    // Convert incoming string date to Date object for the Calendar component
    const selectedDate = React.useMemo(() => {
        if (date instanceof Date) {
            return date;
        }
        if (typeof date === 'string') {
            try {
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) {
                    return parsed;
                }
            } catch (e) {
                 console.error("Error parsing date string in DatePicker:", e);
            }
        }
        return undefined;
    }, [date]);


  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal", // Default full width
            !selectedDate && "text-muted-foreground",
             buttonClassName // Allow passing custom classes to the button
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
           {selectedDate ? format(selectedDate, "PPP", { locale: arSA }) : (buttonContent || <span>اختر تاريخ</span>)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setDate} // setDate expects Date | undefined
          initialFocus
           locale={arSA} // Use Arabic locale for the calendar
        />
      </PopoverContent>
    </Popover>
  )
}
