// import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
// import { ArrowRightIcon, UserCircleIcon } from "lucide-react";
// import type React from "react";
// import {
// 	Popover,
// 	PopoverContent,
// 	PopoverTrigger,
// } from "@/components/ui/popover";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { stringAvatar } from "@/utils/conversion/text";
// import { AvatarUser } from "../avatar-user";
// import { Button, buttonVariants } from "../ui/button";
// import { Separator } from "../ui/separator";

// export function AccountMenu({ children }: React.PropsWithChildren) {
// 	const user = useRouteContext({ from: "/(app)", select: (d) => d.user });
// 	const router = useRouter();
// 	const isMobile = useIsMobile();

// 	return (
// 		<Popover>
// 			<PopoverTrigger asChild>
// 				<Button type="button" variant="icon" size="icon">
// 					<UserCircleIcon className="size-6" color="#333" />
// 				</Button>
// 			</PopoverTrigger>
// 			<PopoverContent
// 				collisionPadding={{ right: 24 }}
// 				className="space-y-4 w-80"
// 			>
// 				<AvatarUser
// 					email={user.email}
// 					fullName={user.name}
// 					initials={stringAvatar(user.name)}
// 				/>
// 				<Link
// 					to="/profile"
// 					className={buttonVariants({
// 						variant: "ghost",
// 						size: "sm",
// 						className: "justify-between! flex w-full flex-row px-2 uppercase",
// 					})}
// 				>
// 					<span>Profile</span>
// 					<ArrowRightIcon size={18} />
// 				</Link>
// 				<Separator />
// 				<Button
// 					className="w-full uppercase"
// 					onClick={async () => {
// 						await authClient.signOut({
// 							fetchOptions: {
// 								onSuccess: () => {
// 									router.invalidate();
// 								},
// 							},
// 						});
// 					}}
// 					rel="noreferrer"
// 					variant="outline"
// 				>
// 					logout
// 				</Button>
// 			</PopoverContent>
// 		</Popover>
// 	);
// }

import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import {
	ChevronsUpDown,
	CreditCardIcon,
	LogOutIcon,
	SettingsIcon,
	UserPenIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function AccountMenu() {
	const user = useRouteContext({ from: "/(app)", select: (d) => d.user });
	const router = useRouter();
	const isMobile = useIsMobile();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="icon" size="icon">
					<Avatar className="h-8 w-8 rounded-lg">
						<AvatarImage
							src="https://github.com/julianklumpers.png"
							alt={user.name}
						/>
						<AvatarFallback className="rounded-lg">CN</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
				align="end"
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage
								src="https://github.com/julianklumpers.png"
								alt={user.name}
							/>
							<AvatarFallback className="rounded-lg">CN</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="truncate text-xs">{user.email}</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<Link to="/profile">
						<DropdownMenuItem>
							<UserPenIcon />
							Profile
						</DropdownMenuItem>
					</Link>
					<DropdownMenuItem>
						<CreditCardIcon />
						Invoices
					</DropdownMenuItem>
					<DropdownMenuItem>
						<SettingsIcon />
						Settings
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={() => {
						//
						console.log("asdasd");
					}}
				>
					<LogOutIcon />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// <SidebarMenu>
// 	<SidebarMenuItem>
// 		<DropdownMenu>
// 			<DropdownMenuTrigger asChild>
// 				<SidebarMenuButton
// 					size="lg"
// 					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
// 				>
// 					<Avatar className="h-8 w-8 rounded-lg">
// 						<AvatarImage src={user.avatar} alt={user.name} />
// 						<AvatarFallback className="rounded-lg">CN</AvatarFallback>
// 					</Avatar>
// 					<div className="grid flex-1 text-left text-sm leading-tight">
// 						<span className="truncate font-medium">{user.name}</span>
// 						<span className="truncate text-xs">{user.email}</span>
// 					</div>
// 					<ChevronsUpDown className="ml-auto size-4" />
// 				</SidebarMenuButton>
// 			</DropdownMenuTrigger>
// 			<DropdownMenuContent
// 				className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
// 				side={isMobile ? "bottom" : "right"}
// 				align="end"
// 				sideOffset={4}
// 			>
// 				<DropdownMenuLabel className="p-0 font-normal">
// 					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
// 						<Avatar className="h-8 w-8 rounded-lg">
// 							<AvatarImage src={user.avatar} alt={user.name} />
// 							<AvatarFallback className="rounded-lg">CN</AvatarFallback>
// 						</Avatar>
// 						<div className="grid flex-1 text-left text-sm leading-tight">
// 							<span className="truncate font-medium">{user.name}</span>
// 							<span className="truncate text-xs">{user.email}</span>
// 						</div>
// 					</div>
// 				</DropdownMenuLabel>
// 				<DropdownMenuSeparator />
// 				<DropdownMenuGroup>
// 					<DropdownMenuItem>
// 						<Sparkles />
// 						Upgrade to Pro
// 					</DropdownMenuItem>
// 				</DropdownMenuGroup>
// 				<DropdownMenuSeparator />
// 				<DropdownMenuGroup>
// 					<DropdownMenuItem>
// 						<BadgeCheck />
// 						Account
// 					</DropdownMenuItem>
// 					<DropdownMenuItem>
// 						<CreditCard />
// 						Billing
// 					</DropdownMenuItem>
// 					<DropdownMenuItem>
// 						<Bell />
// 						Notifications
// 					</DropdownMenuItem>
// 				</DropdownMenuGroup>
// 				<DropdownMenuSeparator />
// 				<DropdownMenuItem>
// 					<LogOut />
// 					Log out
// 				</DropdownMenuItem>
// 			</DropdownMenuContent>
// 		</DropdownMenu>
// 	</SidebarMenuItem>
// </SidebarMenu>;
