import { UserCircleIcon } from "lucide-react";
import type React from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";

export function AccountPopover({ children }: React.PropsWithChildren) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button type="button" variant="icon" size="icon">
					<UserCircleIcon color="#fff" size={24} />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				collisionPadding={{ right: 24 }}
				className="space-y-4 w-80"
			>
				{children}
			</PopoverContent>
		</Popover>
	);
}
