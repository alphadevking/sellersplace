/** Shared ticket-status pill styling for the admin chat inbox and thread. */
export const TICKET_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  OPEN: { bg: "#fef3c7", fg: "#92400e", label: "Open" },
  IN_PROGRESS: { bg: "#dbeafe", fg: "#1e40af", label: "In progress" },
  RESOLVED: { bg: "#dcfce7", fg: "#166534", label: "Resolved" },
};
