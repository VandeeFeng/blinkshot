"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-10",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
          "flex items-center justify-center",
          "relative transition-all duration-200",
          "hover:scale-110"
        ),
        day_selected: "bg-[#4B5563]",
        day_today: "bg-[#6B7280]",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        day_range_start: "rounded-l-md",
        day_range_end: "rounded-r-md",
        day_hasJournal: "bg-green-600/20 text-green-300 hover:bg-green-600/30",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };