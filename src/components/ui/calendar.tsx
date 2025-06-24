import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayFlag, DayPicker, SelectionState, UI } from "react-day-picker";
import { nl } from "react-day-picker/locale";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "react-day-picker/style.css";
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
      className={cn("p-2", className)}
      locale={nl}
      timeZone="Europe/Amsterdam"
      animate
      classNames={{
        [UI.Months]:
          "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        [UI.Month]: "space-y-4",
        [UI.MonthCaption]: "flex justify-center pt-1 relative items-center",
        [UI.CaptionLabel]: "text-sm font-medium",
        [UI.Nav]: "space-x-1 flex items-center",
        [UI.MonthGrid]: "w-full border-collapse space-y-1",
        [UI.Weekdays]: "flex",
        [UI.Weekday]:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        [UI.Week]: "flex w-full mt-2",
        [UI.Day]: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal opacity-100",
        ),
        [SelectionState.range_start]: "day-range-start",
        [SelectionState.range_middle]: "bg-accent rounded-none",
        [SelectionState.range_end]: "day-range-end",
        [SelectionState.selected]:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        [DayFlag.today]: "bg-accent text-accent-foreground",
        [DayFlag.outside]: "text-primary/60 font-extralight",
        [DayFlag.disabled]: "text-muted-foreground opacity-50",
        [DayFlag.hidden]: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ className, ...props }) => (
          <Button
            size="icon"
            variant="outline"
            {...props}
            className="h-7 w-7 absolute left-2 top-3 z-10"
          >
            <ChevronLeft size={18} />
          </Button>
        ),
        NextMonthButton: ({ className, ...props }) => (
          <Button
            size="icon"
            {...props}
            variant="outline"
            className="h-7 w-7 absolute right-2 top-3 z-10"
          >
            <ChevronRight size={18} />
          </Button>
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
