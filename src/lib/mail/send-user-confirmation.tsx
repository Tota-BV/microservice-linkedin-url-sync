import { render } from "@react-email/render";
import transporter from "@/lib/mail/transporter";
import { UserConfirmationEmail } from "./templates/user-confirmation";

type GenerateMailProps = {
	verificationUrl: string;
	email: string;
};

export async function sendVerificiationMail({
	verificationUrl,
	email,
}: GenerateMailProps) {
	const emailHtml = await render(
		<UserConfirmationEmail verificationUrl={verificationUrl} />,
	);

	await transporter
		.sendMail({
			from: '"Tota" <noreply@tota.nl>',
			to: email,
			subject: "Welcome to Tota",
			html: emailHtml,
		})
		.catch((err) => {
			console.log(err);
			throw new Error("Sending user confirmation email failed.");
		});

	return true;
}
