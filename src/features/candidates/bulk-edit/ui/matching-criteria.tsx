import { Show } from "@legendapp/state/react";
import { DateTime } from "luxon";
import type React from "react";
import { useForm } from "react-hook-form";
import { DateTimePicker, TimePicker } from "@/components/datetime-picker";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { AvailabilityType } from "../../profile/model/types";

const days: (keyof AvailabilityType)[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	// "saturday",
	// "sunday",
];

export function BulkEditMatchingCriteria({
	children,
}: React.PropsWithChildren) {
	const form = useForm({
		defaultValues: {
			availability: days.reduce(
				(prev, cur) => ({ ...prev, [cur]: { from: "08:00", to: "17:00" } }),
				{} as AvailabilityType,
			),
			startDate: null,
			endDate: null,
			available: false,
			priceFrom: 0,
			priceTo: 0,
		},
	});

	console.log(form.formState.errors);

	const handleSubmit = (values: any) => {
		console.log(values);
	};

	const isAvailable = form.watch("available");

	console.log(isAvailable);

	return (
		<Sheet>
			<SheetTrigger asChild>{children}</SheetTrigger>
			<SheetContent className="w-[800px]!">
				<SheetHeader>
					<SheetTitle>Bulk edit matching criteria</SheetTitle>
					<SheetDescription>Lorem ipsum dolor sit amet.</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="h-full flex flex-col"
					>
						<div className="grid flex-1 auto-rows-min gap-6 px-4">
							<div className="grid gap-3">
								<FormField
									control={form.control}
									name="available"
									render={({ field }) => (
										<FormItem className="flex justify-between">
											<FormLabel className="text-md font-semibold">
												Available
											</FormLabel>
											<FormControl>
												<Switch
													value={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<Show if={isAvailable}>
								<div className="grid gap-3">
									<Label className="text-md font-semibold">
										Start date - end date
									</Label>
									<div className="flex justify-between items-center gap-2">
										<div className="w-full flex-1">
											<FormField
												control={form.control}
												name="available"
												render={({ field }) => (
													<FormItem>
														<FormControl>
															<DateTimePicker granularity="day" />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<span>-</span>
										<div className="w-full flex-1">
											<FormField
												control={form.control}
												name="available"
												render={({ field }) => (
													<FormItem className="flex justify-between">
														<FormControl>
															<DateTimePicker granularity="day" />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>
								</div>
								<div className="grid gap-3">
									<Label className="text-md font-semibold">Working hours</Label>
									{days.map((day) => {
										return (
											<FormField
												key={day}
												control={form.control}
												name={`availability.${day}`}
												render={({ field }) => (
													<FormItem>
														<FormControl>
															<div className="flex flex-col gap-2">
																<FormLabel>{day}</FormLabel>
																<div className="flex justify-between items-center">
																	<TimePicker
																		granularity="minute"
																		hourCycle={24}
																		date={DateTime.fromFormat(
																			field.value!.from,
																			"HH:mm",
																		).toJSDate()}
																		onChange={(time) => {
																			if (time) {
																				field.onChange({
																					...field.value,
																					from: DateTime.fromJSDate(
																						time,
																					).toFormat("HH:mm"),
																				});
																			}
																		}}
																	/>
																	<span>-</span>
																	<TimePicker
																		granularity="minute"
																		hourCycle={24}
																		date={DateTime.fromFormat(
																			field.value!.to,
																			"HH:mm",
																		).toJSDate()}
																		onChange={(time) => {
																			if (time) {
																				field.onChange({
																					...field.value,
																					to: DateTime.fromJSDate(
																						time,
																					).toFormat("HH:mm"),
																				});
																			}
																		}}
																	/>
																</div>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										);
									})}
								</div>
							</Show>
							<Separator />
							<div className="grid gap-3">
								<Label className="text-md font-semibold">
									Price start - end
								</Label>
								<div className="flex gap-2 items-center">
									<FormField
										control={form.control}
										name="priceFrom"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<div className="relative">
														<span className="-translate-y-1/2 absolute top-1/2 left-3 text-sm">
															&euro;
														</span>
														<Input
															type="number"
															step="1"
															min="0"
															{...field}
															className="pl-6"
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div>-</div>
									<FormField
										control={form.control}
										name="priceTo"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<div className="relative">
														<span className="-translate-y-1/2 absolute top-1/2 left-3 text-sm">
															&euro;
														</span>
														<Input
															type="number"
															step="1"
															min="0"
															{...field}
															className="pl-6"
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
						</div>
						<SheetFooter className="mt-auto">
							<Button type="submit">Save changes</Button>
							<SheetClose asChild>
								<Button variant="outline">Close</Button>
							</SheetClose>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
