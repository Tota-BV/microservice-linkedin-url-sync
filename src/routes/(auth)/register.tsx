import { Show, use$ } from "@legendapp/state/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { agencyStore$ } from "@/features/register/model/agency.store.client";
import { StepFourComplete } from "@/features/register/ui/step-four-complete";
import { StepOneBusinessInfo } from "@/features/register/ui/step-one-business-info";
import { StepThreeAccountInfo } from "@/features/register/ui/step-three-account-info";
import { StepTwoContactInfo } from "@/features/register/ui/step-two-contact-info";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(auth)/register")({
	component: RouteComponent,
});

const steps = [
	{ name: "Agency Info", id: "profile" },
	{ name: "Contact Info", id: "contact" },
	{ name: "Account", id: "account" },
	{ name: "Activate account", id: "activate-account" },
];

const contentVariants = {
	hidden: { opacity: 0, x: 50 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
	exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

function RouteComponent() {
	const stepper = use$(agencyStore$);

	return (
		<div className="flex flex-col gap-2">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="px-0.5"
			>
				<div className="mb-1 flex justify-between">
					{steps.map((step, idx) => (
						<motion.div
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={idx}
							className="flex items-end gap-2"
							whileHover={{ scale: 1.05 }}
						>
							<motion.div
								className={cn(
									"grid size-5 cursor-pointer place-content-center rounded-full transition-colors duration-300",
									idx < stepper.step
										? "bg-primary"
										: idx === stepper.step
											? "bg-primary ring-2 ring-primary/20"
											: "bg-muted",
								)}
								onClick={() => {
									if (idx <= stepper.step) {
										agencyStore$.step.set(idx);
									}
								}}
								whileTap={{ scale: 0.95 }}
							>
								{idx < stepper.step || idx === stepper.step ? (
									<CheckIcon size={12} color="white" />
								) : null}
							</motion.div>
							<motion.span
								className={cn(
									"mt-1.5 hidden text-xs sm:block",
									idx === stepper.step
										? "font-medium text-primary"
										: "text-muted-foreground",
								)}
							>
								{step.name}
							</motion.span>
						</motion.div>
					))}
				</div>
				<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-accent-foreground">
					<motion.div
						className="h-full bg-primary"
						initial={{ width: 0 }}
						animate={{
							width: `${(stepper.step / (steps.length - 1)) * 100}%`,
						}}
						transition={{ duration: 0.3 }}
					/>
				</div>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="overflow-hidden"
			>
				<Card className="w-lg rounded-2xl">
					<AnimatePresence mode="wait">
						<motion.div
							key={stepper.step}
							initial="hidden"
							animate="visible"
							exit="exit"
							variants={contentVariants}
						>
							<CardContent>
								<Show if={stepper.step === 0}>
									<StepOneBusinessInfo />
								</Show>
								<Show if={stepper.step === 1}>
									<StepTwoContactInfo />
								</Show>
								<Show if={stepper.step === 2}>
									<StepThreeAccountInfo />
								</Show>
								<Show if={stepper.step === 3}>
									<StepFourComplete />
								</Show>
							</CardContent>
						</motion.div>
					</AnimatePresence>
				</Card>
			</motion.div>

			<div className="text-center text-sm">
				Already have a account?{" "}
				<Link to="/login" className="underline">
					Login
				</Link>
			</div>
		</div>
	);
}
