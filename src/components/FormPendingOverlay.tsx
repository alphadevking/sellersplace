"use client";

import { useFormStatus } from "react-dom";
import LoadingOverlay from "@/components/LoadingOverlay";

/** Drop inside a <form action={serverAction}> to show LoadingOverlay while it's pending. */
export default function FormPendingOverlay({ label }: { label?: string }) {
  const { pending } = useFormStatus();
  return <LoadingOverlay show={pending} label={label} />;
}
