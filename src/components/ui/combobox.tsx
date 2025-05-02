
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "./skeleton"

interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    id?: string;
    options: ComboboxOption[];
    value?: string; // Currently selected value
    onSelect: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    notFoundText?: string;
    className?: string;
    isLoading?: boolean; // Added loading state
}

export function Combobox({
    id,
    options,
    value,
    onSelect,
    placeholder = "Select option...",
    searchPlaceholder = "Search option...",
    notFoundText = "No option found.",
    className,
    isLoading = false, // Default to false
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !selectedLabel && "text-muted-foreground", className)} // Full width by default, adjust as needed
          disabled={isLoading} // Disable button while loading
        >
           {isLoading ? (
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
           ) : (
              selectedLabel || placeholder
           )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
             {isLoading ? (
                <div className="p-2 space-y-1">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-2/3" />
                 </div>
             ) : (
                <>
                  <CommandEmpty>{notFoundText}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label} // Use label for searching
                        onSelect={(currentLabel) => {
                           // Find the option corresponding to the selected label
                           const selectedOption = options.find(opt => opt.label.toLowerCase() === currentLabel.toLowerCase());
                           if (selectedOption) {
                             onSelect(selectedOption.value) // Call onSelect with the *value*
                             setOpen(false)
                           }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                             value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
             )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
