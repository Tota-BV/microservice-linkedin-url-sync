import z from "zod";

export const agencySchema = z.object({
  country: z.object({
    name: z.string(),
    code: z.string(),
    dial_code: z.string(),
    id: z.number(),
    emoji: z.string(),
  }),
  company: z.object({
    name: z.string().min(1, "This field is requred"),
    number: z.string().min(1, "This field is requred"),
    website: z.string().min(1, "This field is requred"),
  }),
  address: z.object({
    street: z.string().min(1, "This field is requred"),
    postalCode: z.string().min(1, "This field is requred"),
    houseNumber: z.string().min(1, "This field is requred"),
    houseNumberAddition: z.string().optional(),
    city: z.string().min(1, "This field is requred"),
  }),
  phone: z.object({
    dial_code: z.string(),
    number: z.number().min(1, "This field is requred"),
  }),
});

export const pronounce = z.enum(["Mr", "Mrs", "Prefer not to say"]);
export const contactSchema = z.object({
  pronounce,
  name: z.string().min(1, "This field is requred"),
  namePrefix: z.string().min(1, "This field is requred").optional(),
  surname: z.string().min(1, "This field is requred"),
  jobTitle: z.string().min(1, "This field is requred"),
  phone: z.object({
    dial_code: z.string(),
    number: z.number().min(1, "This field is requred"),
  }),
});

export const accountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "This field is requred"),
  termsAccepted: z.literal(true),
  subscribeToNewsLetter: z.boolean().optional(),
});

export type AccountSchema = z.infer<typeof accountSchema>;
export type ContactSchema = z.infer<typeof contactSchema>;
export type AgencySchema = z.infer<typeof agencySchema>;
