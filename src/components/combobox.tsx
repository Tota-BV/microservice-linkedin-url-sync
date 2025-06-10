import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsUpDownIcon } from "lucide-react";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";
import { Separator } from "./ui/separator";

type TValue = { id: string | number; name: string | number } | undefined;

type ComboboxMultiProps<T, N> =
  | {
      data: T[];
      value?: T;
      defaultValue?: T;
      onChange: (val?: T) => void;
      name: N;
      multiSelect?: false;
    }
  | {
      data: T[];
      value?: T[];
      defaultValue?: T[];
      onChange: (val?: T[]) => void;
      name: N;
      multiSelect: true;
    };

type ComboboxCommonProps<T> = {
  renderItem?: (d: T, idx: number) => React.ReactNode;
  getSelectedLabel?: (d: T) => string | React.ReactNode;
  getDefaultLabel?: (d: T[]) => string | React.ReactNode;
  getOptionDisabled?: (d: T) => boolean | undefined;
  loading?: boolean;
  disabled?: boolean;
  defaultLabel?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  fullWidth?: boolean;
  className?: string;
  enableSearch?: boolean;
};

export type ComboboxProps<T, N> = ComboboxCommonProps<T> &
  ComboboxMultiProps<T, N>;

export const toLabelMap = <T extends number | string>(v: T) => ({
  id: v,
  name: v,
});

export function Combobox<T extends TValue, N extends string>(
  props: ComboboxProps<T, N>,
) {
  const {
    data = [],
    renderItem,
    getSelectedLabel,
    getDefaultLabel,
    onChange,
    fullWidth,
    getOptionDisabled,
    defaultLabel,
    searchPlaceholder = "",
    noResultsText = "Geen resultaten gevonden.",
    disabled,
    loading,
    enableSearch = false,
    value,
    defaultValue,
    className,
    multiSelect = false,
  } = props;
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<T | T[] | undefined>(
    defaultValue,
  );

  const resolvedValue = value !== undefined ? value : internalValue;

  const hasOne = data.length === 1;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (!loading && hasOne) {
      if (multiSelect) {
        (onChange as (val: T[]) => void)(data);
      } else {
        (onChange as (val: T) => void)(data[0]);
      }
    }
  }, [hasOne, loading, resolvedValue, multiSelect]);

  const resolveLabel = React.useMemo(() => {
    // if (placeholderresolvedValue) {
    //   return placeholderresolvedValue;
    // }

    if (resolvedValue && multiSelect && Array.isArray(resolvedValue)) {
      return getSelectedLabel
        ? resolvedValue.map(getSelectedLabel).join(", ")
        : resolvedValue.map((v) => v?.name).join(", ");
    }

    if (resolvedValue && !multiSelect && !Array.isArray(resolvedValue)) {
      return getSelectedLabel
        ? getSelectedLabel(resolvedValue as T)
        : resolvedValue?.name;
    }

    return getDefaultLabel ? getDefaultLabel(data) : defaultLabel;
  }, [
    data,
    resolvedValue,
    defaultLabel,
    getDefaultLabel,
    getSelectedLabel,
    multiSelect,
    // placeholderValue
  ]);

  const isSelected = (item: T) => {
    if (!item) {
      return false;
    }

    if (multiSelect && Array.isArray(resolvedValue)) {
      return resolvedValue.some((v) => v?.id === item.id);
    }

    return (resolvedValue as T | undefined)?.id === item.id;
  };

  const handleSelect = (item: T) => () => {
    if (multiSelect) {
      const current = (resolvedValue ?? []) as T[];
      const newValue = isSelected(item)
        ? current.filter((v) => v?.id !== item?.id)
        : [...current, item];

      const items = newValue.length === 0 ? undefined : newValue;
      setInternalValue(items);
      (onChange as (val: T[] | undefined) => void)(items);
    } else {
      setInternalValue(item);
      (onChange as (val: T) => void)(item);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          disabled={loading || disabled || hasOne}
          size="sm"
          variant="outline"
          // biome-ignore lint/a11y/useSemanticElements: <explanation>
          role="combobox"
          aria-expanded={open}
          className={cn(
            "max-w-64 justify-between",
            fullWidth && "w-full max-w-full",
            className,
          )}
        >
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
            {resolveLabel}
          </span>
          {loading ? (
            <LoaderCircleIcon className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-75" />
          ) : (
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-75" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          fullWidth && "w-[var(--radix-popover-trigger-width)] p-1",
        )}
      >
        <Command>
          {enableSearch ? (
            <CommandInput placeholder={`${searchPlaceholder}...`} />
          ) : null}
          {!hasOne && getDefaultLabel ? (
            <div className="space-y-1 py-1 pt-0">
              <CommandItem
                className="py-2 hover:cursor-pointer"
                onSelect={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                {getDefaultLabel(data)}
              </CommandItem>
              <Separator />
            </div>
          ) : null}
          <CommandList>
            <CommandEmpty>{noResultsText}</CommandEmpty>
            <CommandGroup className="p-1 *:space-y-1">
              {data.map((item, idx) =>
                item ? (
                  <CommandItem
                    className={cn(
                      "gap-4 py-2 hover:cursor-pointer",
                      isSelected(item) && "bg-accent text-accent-foreground", // or your selected style
                    )}
                    disabled={getOptionDisabled?.(item)}
                    key={item.id}
                    value={`${item.name}|${item.id}`}
                    onSelect={handleSelect(item)}
                  >
                    {renderItem ? renderItem(item, idx) : item.name}
                  </CommandItem>
                ) : null,
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
