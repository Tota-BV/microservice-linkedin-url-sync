import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import * as React from "react";

type DataPickerProps = {
  onChange: (arg: string) => void;
  fullWidth?: boolean;
  value?: string;
};

export function DatePicker({ value, onChange, fullWidth }: DataPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [dateValue, setDateValue] = React.useState(() => {
    if (value) {
      return DateTime.fromISO(value).toJSDate();
    }

    return DateTime.now().toJSDate();
  });

  const handleClose = () => {
    const val = DateTime.fromJSDate(dateValue);

    if (val) {
      setDateValue(val.toJSDate());
      onChange(val.toISODate()!);
      setOpen(false);
    }
  };

  const handleStartDateSelect = (date?: Date) => {
    if (date) {
      setDateValue(date);
    }
  };

  return (
    <Popover
      onOpenChange={(openState) => {
        setOpen(openState);
        if (!openState) {
          handleClose();
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-[200px] items-center justify-start gap-2",
            fullWidth && "w-full",
          )}
          onClick={() => setOpen(true)}
          variant="outline"
        >
          <CalendarIcon size={16} />
          <span>{DateTime.fromJSDate(dateValue).toFormat("dd-MM-yyyy")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Calendar
              captionLayout="dropdown"
              mode="single"
              month={dateValue}
              onMonthChange={handleStartDateSelect}
              onSelect={handleStartDateSelect}
              selected={dateValue}
            />
          </div>
          <Button className="mt-2" onClick={handleClose}>
            Toepassen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
