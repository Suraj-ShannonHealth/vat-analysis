"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFormStore } from "@/lib/form-store";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  type FullFormData,
} from "@/lib/validations/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Requestor & Item Information", schema: step1Schema },
  { id: 2, title: "Product Classification", schema: step2Schema },
  { id: 3, title: "Operational Justification", schema: step3Schema },
  { id: 4, title: "Specific Product & Usage", schema: step4Schema },
  { id: 5, title: "Financial Information", schema: step5Schema },
];

export default function FormWizard() {
  const router = useRouter();
  const {
    currentStep,
    data,
    quoteFiles,
    payorMixFiles,
    setStep,
    updateData,
    setQuoteFiles,
    setPayorMixFiles,
    reset,
  } = useFormStore();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const currentSchema = STEPS[currentStep - 1].schema;

  const form = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: data as any,
    mode: "onChange",
  });

  // Keep form values in sync when navigating back
  // (react-hook-form + zustand)
  const stepData = data;

  const onNext = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    const values = form.getValues();
    updateData(values);

    if (currentStep === 2) {
      // quote is mandatory
      if (quoteFiles.length === 0) {
        setQuoteError("A quote is mandatory. Please upload at least one file.");
        return;
      }
      setQuoteError(null);
    }

    if (currentStep < 5) {
      setStep(currentStep + 1);
      form.reset({ ...data, ...values });
    }
  };

  const onBack = () => {
    const values = form.getValues();
    updateData(values);
    if (currentStep > 1) {
      setStep(currentStep - 1);
      form.reset({ ...data, ...values });
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "quote" | "payorMix"
  ) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = field === "quote" ? 4 : 2;
    const maxSize = field === "quote" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;

    const existing = field === "quote" ? quoteFiles : payorMixFiles;
    if (existing.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const valid = files.filter((f) => f.size <= maxSize);
    if (valid.length < files.length) {
      alert(`Some files exceed the size limit`);
    }

    const mapped = valid.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      field,
      size: f.size,
      file: f,
    }));

    if (field === "quote") {
      setQuoteFiles([...existing, ...mapped]);
      setQuoteError(null);
    } else {
      setPayorMixFiles([...existing, ...mapped]);
    }
    e.target.value = "";
  };

  const removeFile = (id: string, field: "quote" | "payorMix") => {
    if (field === "quote") {
      setQuoteFiles(quoteFiles.filter((f) => f.id !== id));
    } else {
      setPayorMixFiles(payorMixFiles.filter((f) => f.id !== id));
    }
  };

  const onSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    const values = form.getValues();
    updateData(values);
    const allData = { ...data, ...values };

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(allData));

      quoteFiles.forEach((f) => {
        if (f.file) formData.append("quote", f.file, f.name);
      });
      payorMixFiles.forEach((f) => {
        if (f.file) formData.append("payorMix", f.file, f.name);
      });

      const res = await fetch("/api/form/submit", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Submission failed");
      }

      reset();
      router.push("/form/success");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Step {currentStep} of 5 — {STEPS[currentStep - 1].title}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>
            All questions are required unless marked optional. Incomplete
            answers (N/A, TBD) are not accepted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <Step1Fields form={form} />
          )}
          {currentStep === 2 && (
            <>
              <Step2Fields form={form} />
              <div className="space-y-2">
                <Label>
                  Quote (mandatory){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Up to 4 files, 100MB each. Allowed: Word, Excel, PPT, PDF,
                  Image, Video, Audio
                </p>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="quote-upload"
                    className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
                  >
                    <Upload className="h-4 w-4" />
                    Upload quote
                  </Label>
                  <input
                    id="quote-upload"
                    type="file"
                    multiple
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,image/*,video/*,audio/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "quote")}
                  />
                </div>
                {quoteError && (
                  <p className="text-sm text-destructive">{quoteError}</p>
                )}
                <FileList
                  files={quoteFiles}
                  onRemove={(id) => removeFile(id, "quote")}
                />
              </div>
            </>
          )}
          {currentStep === 3 && <Step3Fields form={form} />}
          {currentStep === 4 && <Step4Fields form={form} />}
          {currentStep === 5 && (
            <>
              <Step5Fields form={form} />
              <div className="space-y-2">
                <Label>
                  Additional payor mix / insurance reimbursement info (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Up to 2 files, 10MB each
                </p>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="payor-upload"
                    className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
                  >
                    <Upload className="h-4 w-4" />
                    Upload files
                  </Label>
                  <input
                    id="payor-upload"
                    type="file"
                    multiple
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,image/*,video/*,audio/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "payorMix")}
                  />
                </div>
                <FileList
                  files={payorMixFiles}
                  onRemove={(id) => removeFile(id, "payorMix")}
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={currentStep === 1 || submitting}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button type="button" onClick={onNext}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={onSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function FileList({
  files,
  onRemove,
}: {
  files: { id: string; name: string; size: number }[];
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="space-y-1 mt-2">
      {files.map((f) => (
        <li
          key={f.id}
          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
        >
          <span className="truncate">
            {f.name}{" "}
            <span className="text-muted-foreground">
              ({(f.size / 1024).toFixed(1)} KB)
            </span>
          </span>
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------- Step field components ----------

function FieldError({ error }: { error?: { message?: string } }) {
  if (!error?.message) return null;
  return <p className="text-sm text-destructive mt-1">{error.message}</p>;
}

function Step1Fields({ form }: { form: any }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <div>
        <Label>1. Type of Request *</Label>
        <div className="flex gap-4 mt-2">
          {["Medical VAT", "Surgical VAT"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={opt} {...register("typeOfRequest")} />
              {opt}
            </label>
          ))}
        </div>
        <FieldError error={errors.typeOfRequest} />
      </div>

      <div>
        <Label>2. Requested By *</Label>
        <div className="flex gap-4 mt-2">
          {["Employee", "Provider"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={opt} {...register("requestedBy")} />
              {opt}
            </label>
          ))}
        </div>
        <FieldError error={errors.requestedBy} />
      </div>

      <div>
        <Label htmlFor="requestedByNameTitle">
          3. Requested By (Name and Title) *
        </Label>
        <Input id="requestedByNameTitle" {...register("requestedByNameTitle")} className="mt-1" />
        <FieldError error={errors.requestedByNameTitle} />
      </div>

      <div>
        <Label htmlFor="requesterEmail">4. Team Member Requester Email *</Label>
        <Input id="requesterEmail" type="email" {...register("requesterEmail")} className="mt-1" />
        <FieldError error={errors.requesterEmail} />
      </div>

      <div>
        <Label htmlFor="requesterPhone">
          5. Team Member Requester Phone Number/Extension *
        </Label>
        <Input id="requesterPhone" {...register("requesterPhone")} className="mt-1" />
        <FieldError error={errors.requesterPhone} />
      </div>

      <div>
        <Label htmlFor="requestingDepartment">
          6. Requesting Department/Unit *
        </Label>
        <Input id="requestingDepartment" {...register("requestingDepartment")} className="mt-1" />
        <FieldError error={errors.requestingDepartment} />
      </div>

      <div>
        <Label>7. Is the request for a new provider/service? *</Label>
        <div className="flex gap-4 mt-2">
          {["Yes", "No"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt}
                {...register("isNewProviderService")}
              />
              {opt}
            </label>
          ))}
        </div>
        <FieldError error={errors.isNewProviderService} />
      </div>

      <div>
        <Label htmlFor="productServiceName">
          8. Name of Product/Service Description Being Requested *
        </Label>
        <Input id="productServiceName" {...register("productServiceName")} className="mt-1" />
        <FieldError error={errors.productServiceName} />
      </div>

      <div>
        <Label htmlFor="vendorManufacturer">
          9. Name of Vendor/Manufacturer of Product Being Requested *
        </Label>
        <Input id="vendorManufacturer" {...register("vendorManufacturer")} className="mt-1" />
        <FieldError error={errors.vendorManufacturer} />
      </div>

      <div>
        <Label htmlFor="catalogNumber">
          10. Catalog/Manufacturer Number of Product Being Requested *
        </Label>
        <Input id="catalogNumber" {...register("catalogNumber")} className="mt-1" />
        <FieldError error={errors.catalogNumber} />
      </div>

      <div>
        <Label htmlFor="manufacturerRep">
          11. Manufacturer/Vendor Representative (Name & Phone Number) *
        </Label>
        <Input id="manufacturerRep" {...register("manufacturerRep")} className="mt-1" />
        <FieldError error={errors.manufacturerRep} />
      </div>

      <div>
        <Label>12. This product is a *</Label>
        <div className="space-y-2 mt-2">
          {[
            "New Product (not currently used at the organization or in department and not replacing an existing product)",
            "New Service (not currently offered and not replacing an existing service)",
            "Replacement Product (replacing a product currently in use, including new technology or alternative vendors)",
            "Replacement Service (replacing an existing service currently in use)",
          ].map((opt) => (
            <label key={opt} className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt}
                {...register("productType")}
                className="mt-1"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        <FieldError error={errors.productType} />
      </div>
    </div>
  );
}

function Step2Fields({ form }: { form: any }) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <div className="space-y-5">
      <div>
        <Label>13. This product is classified as *</Label>
        <div className="flex gap-4 mt-2">
          {["Reusable", "Disposable"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt}
                {...register("productClassification")}
              />
              {opt}
            </label>
          ))}
        </div>
        <FieldError error={errors.productClassification} />
      </div>

      <div>
        <Label>14. Is this product identified as minor equipment? *</Label>
        <div className="flex gap-4 mt-2">
          {["Yes", "No"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt}
                {...register("isMinorEquipment")}
              />
              {opt}
            </label>
          ))}
        </div>
        <FieldError error={errors.isMinorEquipment} />
      </div>

      <div>
        <Label htmlFor="capitalEquipmentInfo">
          15. Is there Capital Equipment associated with this request? If yes,
          what is the Capital Request number?
        </Label>
        <Input
          id="capitalEquipmentInfo"
          {...register("capitalEquipmentInfo")}
          className="mt-1"
          placeholder="Optional"
        />
      </div>
    </div>
  );
}

function Step3Fields({ form }: { form: any }) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <div className="space-y-5">
      <div>
        <Label>17. Purpose of Request *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            "Expense Reduction",
            "Quality Improvement",
            "Revenue Enhancement",
            "Upgraded Technology",
            "Safety",
            "Other",
          ].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt}
                {...register("purposeOfRequest")}
              />
              {opt}
            </label>
          ))}
        </div>
        <FieldError error={errors.purposeOfRequest} />
      </div>

      <div>
        <Label htmlFor="reasonForRequest">
          18. Describe reason(s) for new/replacement product request *
        </Label>
        <Textarea
          id="reasonForRequest"
          {...register("reasonForRequest")}
          className="mt-1"
          rows={3}
        />
        <FieldError error={errors.reasonForRequest} />
      </div>

      <div>
        <Label htmlFor="concernsWithExisting">
          19. Describe concern(s) with existing product (if applicable)
        </Label>
        <Textarea
          id="concernsWithExisting"
          {...register("concernsWithExisting")}
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="currentProcedures">
          20. How are procedures currently being performed without the use of
          this product? *
        </Label>
        <Textarea
          id="currentProcedures"
          {...register("currentProcedures")}
          className="mt-1"
          rows={3}
        />
        <FieldError error={errors.currentProcedures} />
      </div>

      <div>
        <Label htmlFor="clinicalOutcome">
          21. Intended clinical outcome or goal of this product *
        </Label>
        <Textarea
          id="clinicalOutcome"
          {...register("clinicalOutcome")}
          className="mt-1"
          rows={3}
        />
        <FieldError error={errors.clinicalOutcome} />
      </div>

      <div>
        <Label htmlFor="measureEffectiveness">
          22. How will you measure the effectiveness of this product? *
        </Label>
        <Textarea
          id="measureEffectiveness"
          {...register("measureEffectiveness")}
          className="mt-1"
          rows={3}
        />
        <FieldError error={errors.measureEffectiveness} />
      </div>

      <div>
        <Label htmlFor="clinicalMetrics">
          23. What clinical metrics will this product improve? *
        </Label>
        <Textarea
          id="clinicalMetrics"
          {...register("clinicalMetrics")}
          className="mt-1"
          rows={3}
        />
        <FieldError error={errors.clinicalMetrics} />
      </div>
    </div>
  );
}

function Step4Fields({ form }: { form: any }) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="governingBody">
          24. Is there a governing body that requires/mandates the use of this
          product?
        </Label>
        <Input id="governingBody" {...register("governingBody")} className="mt-1" />
      </div>

      <div>
        <Label htmlFor="multiDepartmentUsage">
          25. Will this product be used in more than one department? If yes,
          please list all departments.
        </Label>
        <Textarea
          id="multiDepartmentUsage"
          {...register("multiDepartmentUsage")}
          className="mt-1"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="anticipatedMonthlyUsage">
          26. Anticipated monthly usage *
        </Label>
        <Input
          id="anticipatedMonthlyUsage"
          {...register("anticipatedMonthlyUsage")}
          className="mt-1"
        />
        <FieldError error={errors.anticipatedMonthlyUsage} />
      </div>

      <div>
        <Label htmlFor="specialHandling">
          27. Are there any special handling or storage requirements?
        </Label>
        <Textarea
          id="specialHandling"
          {...register("specialHandling")}
          className="mt-1"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="trainingRequired">
          28. Will this product require any specific training or support for
          implementation?
        </Label>
        <Textarea
          id="trainingRequired"
          {...register("trainingRequired")}
          className="mt-1"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="usedWithOtherProduct">
          29. Will this product be used in conjunction with another product? If
          yes, what product?
        </Label>
        <Input
          id="usedWithOtherProduct"
          {...register("usedWithOtherProduct")}
          className="mt-1"
        />
      </div>
    </div>
  );
}

function Step5Fields({ form }: { form: any }) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="patientChargeable">
          30. Is this product a patient chargeable item? *
        </Label>
        <Input
          id="patientChargeable"
          {...register("patientChargeable")}
          className="mt-1"
        />
        <FieldError error={errors.patientChargeable} />
      </div>

      <div>
        <Label htmlFor="revenueHcpcsCode">
          31. Please provide the revenue/HCPCS code
        </Label>
        <Input
          id="revenueHcpcsCode"
          {...register("revenueHcpcsCode")}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="expectedRoi">
          32. What is the expected Return on Investment from this product? (ex:
          reduced hospital stays, fewer complications, etc.) *
        </Label>
        <Textarea
          id="expectedRoi"
          {...register("expectedRoi")}
          className="mt-1"
          rows={3}
        />
        <FieldError error={errors.expectedRoi} />
      </div>

      <div>
        <Label htmlFor="costJustification">
          33. Is the cost of this product justified by the clinical benefits or
          improved patient outcomes? Please explain *
        </Label>
        <Textarea
          id="costJustification"
          {...register("costJustification")}
          className="mt-1"
          rows={3}
        />
        <FieldError error={errors.costJustification} />
      </div>
    </div>
  );
}
