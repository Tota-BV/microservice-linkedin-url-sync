import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface ConfirmEmailProps {
	verificationUrl: string;
}

export const UserConfirmationEmail = ({
	verificationUrl,
}: ConfirmEmailProps) => (
	<Html>
		<Head />
		<Preview>Welcome to Tota</Preview>
		<Body style={styles.main}>
			<Container style={styles.bodyContainer}>
				<Container style={styles.container}>
					<Section style={styles.logoContainer}>
						<Img
							src="https://tota-webapp-staging.up.railway.app/tota-logo-dark.svg"
							width="120"
							height="40"
							alt="Tota"
						/>
					</Section>
					<Heading style={styles.h1}>Welcome to Tota</Heading>
					<Text style={styles.text}>
						Please confirm your email address using the button below. Once
						confirmed, you’ll be logged in automatically.
					</Text>
					<Section style={styles.codeBox}>
						<Button style={styles.button} href={verificationUrl}>
							Get started
						</Button>
					</Section>
					<Text style={styles.text}>
						Wishing you a great experience on our platform!
					</Text>
				</Container>
			</Container>
		</Body>
	</Html>
);

UserConfirmationEmail.PreviewProps = {
	verificationUrl: "",
} as ConfirmEmailProps;

const styles = {
	main: {
		backgroundColor: "#f4f6f8",
		margin: "0 auto",
		fontFamily:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
	},
	bodyContainer: {
		backgroundColor: "#f4f6f8",
		width: "100%",
		maxWidth: "none",
	},
	container: {
		margin: "0 auto",
		padding: "0px 20px",
	},
	logoContainer: {
		marginTop: "32px",
	},
	h1: {
		color: "#333",
		fontSize: "20px",
		fontWeight: "700",
		margin: "24px 0",
		padding: "0",
	},
	heroText: {
		color: "#333",
		fontSize: "14px",
		lineHeight: "20px",
		marginBottom: "30px",
	},
	codeBox: {
		margin: "30px 0px",
		padding: "26px 10px",
		textAlign: "center" as const,
	},
	confirmationCodeText: {
		color: "#000",
		fontSize: "30px",
		verticalAlign: "middle",
	},
	text: {
		color: "#333",
		fontSize: "14px",
		lineHeight: "20px",
	},
	button: {
		backgroundColor: "rgb(106, 27, 154)",
		borderRadius: "6px",
		color: "#fff",
		fontSize: "16px",
		textDecoration: "none",
		textAlign: "center" as const,
		display: "block",
		padding: "12px",
	},
};
