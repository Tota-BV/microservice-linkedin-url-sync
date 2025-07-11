import z from "zod";

export const loginSchema = z.object({
	email: z
		.string()
		.email({ message: "Please provide a valid email address." })
		.min(1),
	password: z.string().min(1, { message: "Password is required." }),
	rememberMe: z.boolean().optional().default(false),
});

export type LoginSchema = z.infer<typeof loginSchema>;
