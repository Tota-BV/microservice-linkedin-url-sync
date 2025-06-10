import { Combobox, type ComboboxProps } from "@/components/combobox";
import countryList from "./country-list.json";

function codeToEmoji(code: string) {
  if (!code || typeof code !== "string") {
    return "";
  }

  return [...code.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export const countries = countryList
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c, idx) => ({
    ...c,
    id: idx + 1,
    emoji: codeToEmoji(c.code),
  }));

type CountryPickerProps = ComboboxProps<(typeof countries)[number], string> & {
  multiSelect?: false;
  includeDialCode?: boolean;
};

export function CountryPicker(
  props: Omit<CountryPickerProps, "data" | "name">,
) {
  if (props.includeDialCode) {
    return (
      <Combobox
        renderItem={(d) => (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-7 text-2xl">{d.emoji}</span>
              {d.name}
            </div>
            <span className="">{d.dial_code}</span>
          </div>
        )}
        getSelectedLabel={(d) => (
          <div className="flex items-center gap-1">
            <span className="size-7 text-2xl">{d.emoji}</span>
            {d.dial_code}
          </div>
        )}
        enableSearch
        className="h-full w-30 rounded-none border-t-0 border-b-0 border-l-0 shadow-none"
        {...props}
        name="dial_code"
        data={countries}
      />
    );
  }

  return (
    <Combobox
      renderItem={(d) => (
        <div className="flex items-center gap-2">
          <span className="size-7 text-2xl">{d.emoji}</span>
          {d.name}
        </div>
      )}
      getSelectedLabel={(d) => (
        <div className="flex items-center gap-2">
          <span className="size-7 text-2xl">{d.emoji}</span>
          {d.name}
        </div>
      )}
      enableSearch
      {...props}
      name="country"
      data={countries}
    />
  );
}
