import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AvatarUser({
	fullName,
	initials,
	email,
}: {
	initials?: string;
	fullName?: string;
	email?: string;
}) {
	return (
		<div className="flex flex-row items-center space-x-3 w-64">
			<Avatar>
				<AvatarFallback className="bg-primary text-white">
					{initials}
				</AvatarFallback>
			</Avatar>
			<div className="flex flex-col text-sm">
				<span className="font-semibold font-display">{fullName}</span>
				<span className="text-xs">{email}</span>
			</div>
		</div>
	);
}
