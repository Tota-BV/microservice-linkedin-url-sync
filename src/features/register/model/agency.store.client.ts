import { observable } from "@legendapp/state";
import { ObservablePersistSessionStorage } from "@legendapp/state/persist-plugins/local-storage";
import { synced } from "@legendapp/state/sync";
import type { AccountSchema, AgencySchema, ContactSchema } from "./schema";

export interface StepperStore {
  data: {
    agency: AgencySchema | undefined;
    contact: ContactSchema | undefined;
    account: AccountSchema | undefined;
  };
  step: number;
  complete: boolean;
}

export const agencyStore$ = observable<StepperStore>(
  synced({
    initial: {
      data: {
        agency: undefined,
        contact: undefined,
        account: undefined,
      },
      step: 0,
      complete: false,
    },
    persist: {
      name: "agency-wizard",
      plugin: ObservablePersistSessionStorage,
    },
  }),
);
