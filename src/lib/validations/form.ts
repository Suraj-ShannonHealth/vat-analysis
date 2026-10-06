import { z } from "zod";

const noNa = (msg = "Incomplete responses such as N/A or TBD are not accepted") =>
  z
    .string()
    .min(1, "This field is required")
    .refine((v) => !/^(n\/?a|tbd|na)$/i.test(v.trim()), { message: msg });

export const step1Schema = z.object({
  typeOfRequest: z.enum(["Medical VAT", "Surgical VAT"], {
    required_error: "Type of Request is required",
  }),
  requestedBy: z.enum(["Employee", "Provider"], {
    required_error: "Requested By is required",
  }),
  requestedByNameTitle: noNa("Name and Title is required"),
  requesterEmail: z.string().email("Valid email is required"),
  requesterPhone: z.string().min(1, "Phone number is required"),
  requestingDepartment: z.string().min(1, "Department/Unit is required"),
  isNewProviderService: z.enum(["Yes", "No"], {
    required_error: "This field is required",
  }),
  productServiceName: noNa("Product/Service name is required"),
  vendorManufacturer: z.string().min(1, "Vendor/Manufacturer is required"),
  catalogNumber: z.string().min(1, "Catalog/Manufacturer Number is required"),
  manufacturerRep: z
    .string()
    .min(1, "Manufacturer/Vendor Representative is required"),
  productType: z.enum(
    [
      "New Product (not currently used at the organization or in department and not replacing an existing product)",
      "New Service (not currently offered and not replacing an existing service)",
      "Replacement Product (replacing a product currently in use, including new technology or alternative vendors)",
      "Replacement Service (replacing an existing service currently in use)",
    ],
    { required_error: "Product type is required" }
  ),
});

export const step2Schema = z.object({
  productClassification: z.enum(["Reusable", "Disposable"], {
    required_error: "Classification is required",
  }),
  isMinorEquipment: z.enum(["Yes", "No"], {
    required_error: "This field is required",
  }),
  capitalEquipmentInfo: z.string().optional(),
});

/** Step 3 – Product request details (replaces old operational justification block) */
export const step3Schema = z.object({
  presenters: z.string().optional(),
  teamLeads: z.string().optional(),
  purpose: noNa("Purpose is required"),
  procedures: noNa("Procedure(s) is required"),
  usedWith: z.string().optional(),
  departmentsImpacted: z.string().optional(),
  providersImpacted: z.string().optional(),
  reasonsForRequest: noNa("Reasons for request are required"),
  currentProcedures: noNa("This field is required"),
  clinicalMetrics: noNa("Clinical metrics is required"),
});

export const step4Schema = z.object({
  governingBody: z.string().optional(),
  multiDepartmentUsage: z.string().optional(),
  anticipatedMonthlyUsage: z
    .string()
    .min(1, "Anticipated monthly usage is required"),
  specialHandling: z.string().optional(),
  usedWithOtherProduct: z.string().optional(),
});

/** Step 5 – Financials for Product Request */
export const step5Schema = z.object({
  proposedAnnualCostImpact: noNa(
    "Proposed annual cost increase (savings) is required"
  ),
  annualUsageOld: z.string().optional(),
  annualUsageNew: z.string().optional(),
  replacingItems: z.string().optional(),
  expectedRoi: noNa("Expected ROI is required"),
});

export const fullFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema);

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type FullFormData = z.infer<typeof fullFormSchema>;
