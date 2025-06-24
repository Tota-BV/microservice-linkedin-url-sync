export type Document = {
  id:
    | "business-registration"
    | "bank-account"
    | "customer-screening"
    | "tax-verification";
  title: string;
  icon: React.ReactNode;
};

export type ReferenceAndProject = {
  title: string;
  text: string;
};
