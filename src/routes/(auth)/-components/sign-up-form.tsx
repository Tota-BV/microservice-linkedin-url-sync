import { agencyStore$ } from "@/features/agency-register/model/agency.store.client";
import { type AgencySchema } from "@/features/agency-register/model/schema";
import { StepOneBusinessInfo } from "@/features/agency-register/ui/step-one-business-info";
import { StepThreeAccountInfo } from "@/features/agency-register/ui/step-three-account-info";
import { StepTwoContactInfo } from "@/features/agency-register/ui/step-two-contact-info";
import { Show, use$ } from "@legendapp/state/react";

export function SignUpForm() {
  const stepper = use$(agencyStore$);

  const onSubmit = (values: AgencySchema) => {
    console.log(values);
    agencyStore$.data.agency.set(values);
  };

  return (
    <div>
      <Show if={stepper.step === 1}>
        <StepOneBusinessInfo />
      </Show>
      <Show if={stepper.step === 2}>
        <StepTwoContactInfo />
      </Show>
      <Show if={stepper.step === 3}>
        <StepThreeAccountInfo />
      </Show>
    </div>
  );
}
