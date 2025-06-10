import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTRPC } from "@/lib/trpc/react";
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2Icon } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import type { components, paths } from "../../api/api";
import type { AgencySchema } from "../../model/schema";

export function KvKFinder() {
  const trpc = useTRPC();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const form = useFormContext<AgencySchema>();

  const [debouncedValue] = useDebouncedValue(value, {
    wait: 500,
    enabled: () => value.length > 3,
  });

  const { data, isLoading, isFetching } = useQuery(
    trpc.kvk.search.queryOptions(
      { query: debouncedValue },
      { enabled: !!debouncedValue && debouncedValue.length >= 3 },
    ),
  );

  const handleSelect = (
    result: components["schemas"]["ResultaatItem"],
    currentValue: string,
  ) => {
    form.setValue("address", {
      city: result.adres?.binnenlandsAdres?.plaats ?? "",
      street: result.adres?.binnenlandsAdres?.straatnaam ?? "",
      houseNumber: `${result.adres?.binnenlandsAdres?.huisnummer ?? ""}`,
      postalCode: result.adres?.binnenlandsAdres?.postcode ?? "",
    });
    form.setValue("company", {
      name: result.naam ?? "",
      number: result.kvkNummer ?? "",
      website: "",
    });

    setValue(result.naam ?? "");
    setOpen(false);
  };

  console.log(data);

  return (
    <div className="grid gap-3">
      <FormLabel>
        <img src="/kvk-logo.svg" width="36" alt="KvK" />
      </FormLabel>
      <div className="flex gap-2">
        <Popover
          open={open && debouncedValue.length > 3}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <div className="w-full relative">
              <Input
                className="pr-8"
                onChange={(event) => setValue(event.target.value)}
                placeholder="Company name or KvK number"
                type="text"
                value={value}
              />
              {isLoading || isFetching ? (
                <Loader2Icon
                  className="absolute right-2.5 top-2.5 animate-spin"
                  size={16}
                />
              ) : null}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList>
                <CommandEmpty>
                  {data && "fout" in data
                    ? data.fout?.[0].omschrijving
                    : "Nothing found"}
                </CommandEmpty>

                <CommandGroup>
                  {data && "resultaten" in data
                    ? data.resultaten?.map((result) => {
                        if (
                          !result.adres?.binnenlandsAdres ||
                          result.type !== "hoofdvestiging"
                        ) {
                          return null;
                        }

                        return (
                          <CommandItem
                            key={result.rsin}
                            value={result.vestigingsnummer}
                            className="p-2 hover:cursor-pointer"
                            onSelect={(currentValue) =>
                              handleSelect(result, currentValue)
                            }
                          >
                            <div className="grid">
                              <span className="">{result.kvkNummer}</span>
                              {result.naam}
                            </div>
                          </CommandItem>
                        );
                      })
                    : null}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
