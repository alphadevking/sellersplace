"use client";

import { Printer } from "lucide-react";

/** Print/save-as-PDF trigger — hidden in the printout itself. */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-outline print:hidden"
    >
      <Printer className="h-4 w-4" /> Print / PDF
    </button>
  );
}
