import { zfd } from "zod-form-data";

export const uploadFileSchema = zfd.formData({
  "business-registration": zfd.file().optional(),
  "bank-account": zfd.file().optional(),
  "customer-screening": zfd.file().optional(),
  "tax-verification": zfd.file().optional(),
});
