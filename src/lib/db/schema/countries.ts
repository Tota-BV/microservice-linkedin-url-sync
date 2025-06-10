import { pgTable, text } from "drizzle-orm/pg-core";

export const countries = pgTable("countries", {
  code: text("code").primaryKey().notNull(),
  name: text("name").notNull(),
  dialCode: text("dial_code").notNull(),
  emoji: text("emoji").notNull(),
});
