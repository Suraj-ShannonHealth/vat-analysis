"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FullFormData } from "./validations/form";

type UploadedFile = {
  id: string;
  name: string;
  field: "quote" | "payorMix";
  size: number;
  // temp client-side only until submit
  file?: File;
  path?: string;
};

type FormState = {
  currentStep: number;
  data: Partial<FullFormData>;
  quoteFiles: UploadedFile[];
  payorMixFiles: UploadedFile[];
  setStep: (step: number) => void;
  updateData: (partial: Partial<FullFormData>) => void;
  setQuoteFiles: (files: UploadedFile[]) => void;
  setPayorMixFiles: (files: UploadedFile[]) => void;
  reset: () => void;
};

const initialData: Partial<FullFormData> = {};

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: initialData,
      quoteFiles: [],
      payorMixFiles: [],
      setStep: (step) => set({ currentStep: step }),
      updateData: (partial) =>
        set((state) => ({ data: { ...state.data, ...partial } })),
      setQuoteFiles: (files) => set({ quoteFiles: files }),
      setPayorMixFiles: (files) => set({ payorMixFiles: files }),
      reset: () =>
        set({
          currentStep: 1,
          data: initialData,
          quoteFiles: [],
          payorMixFiles: [],
        }),
    }),
    {
      name: "vat-approval-form",
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
        // files not persisted as File objects can't be serialized easily
      }),
    }
  )
);
