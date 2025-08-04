import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_URL,
	port: Number(process.env.SMTP_PORT),
	// host: 'smtp.flowmailer.net',
	// port: 587,
	// secure: false, // Gebruik TLS, niet SMTPS
	// auth: {
	//   user: 'HogGpiGk3JYsoIMr', // Gebruikersnaam
	//   pass: 'cXOJXMicAxoIuXA', // Wachtwoord
	// },
});

export default transporter;
