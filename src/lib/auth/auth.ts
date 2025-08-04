import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, magicLink, openAPI, organization } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";
import { passkey } from "better-auth/plugins/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { reactStartCookies } from "better-auth/react-start";
import { createClient } from "redis";
import { SendMagicLinkEmail } from "@/components/emails/send-magic-link-email";
import { SendVerificationOTP } from "@/components/emails/send-verification-otp";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema/auth";
import { sendEmail } from "@/lib/resend";
import { env } from "../env.server";
import { sendVerificiationMail } from "../mail/send-user-confirmation";

const redis = createClient({
	url: env.REDIS_URL,
	database: 0,
});

await redis.connect();

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	secret: env.BETTER_AUTH_SECRET,
	basePath: "/api/auth",
	secondaryStorage: {
		get: async (key) => {
			const value = await redis.get(key);
			return value ? value : null;
		},
		set: async (key, value, ttl) => {
			if (ttl) {
				await redis.set(key, value, { EX: ttl });
			} else {
				await redis.set(key, value);
			}
		},
		delete: async (key) => {
			await redis.del(key);
		},
	},
	rateLimit: {
		enabled: true,
		max: 100,
		window: 10,
	},
	user: {
		deleteUser: {
			enabled: true,
		},
	},
	logger: {
		enabled: true,
		level: "info",
	},
	// databaseHooks: {
	//   user: {
	//     create: {
	//       after: async (user) => {
	//         await sendEmail({
	//           subject: "Welcome to MyApp",
	//           template: WelcomeEmail({
	//             username: user.name || user.email,
	//           }),
	//           to: user.email,
	//         });
	//       },
	//     },
	//   },
	// },
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		// async sendResetPassword({ url, user }) {
		//   await sendEmail({
		//     subject: "Reset your password",
		//     template: ResetPasswordEmail({
		//       resetLink: url,
		//       username: user.email,
		//     }),
		//     to: user.email,
		//   });
		// },
	},
	emailVerification: {
		autoSignInAfterVerification: true,
		sendOnSignUp: true,
		sendVerificationEmail: async ({ url, user }) => {
			try {
				await sendVerificiationMail({
					verificationUrl: url,
					email: user.email,
				});
			} catch (err) {
				console.log(err);
			}
		},
	},
	plugins: [
		openAPI(),
		twoFactor(),
		passkey(),
		admin(),
		organization(),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				await sendEmail({
					subject: "Verify your email",
					template: SendVerificationOTP({
						username: email,
						otp: otp,
					}),
					to: email,
				});
			},
		}),
		magicLink({
			sendMagicLink: async ({ email, token, url }, request) => {
				await sendEmail({
					subject: "Magic Link",
					template: SendMagicLinkEmail({
						username: email,
						url: url,
						token: token,
					}),
					to: email,
				});
			},
		}),
		reactStartCookies(),
	],
});
