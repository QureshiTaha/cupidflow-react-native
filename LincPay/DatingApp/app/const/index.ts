import { Dimensions } from "react-native";
import moment from "moment";

const { width, height } = Dimensions.get("window");
export const sizes = {
  width,
  height,
};

export const statusColors: Record<string, string> = {
  success: "#4ade80",
  "withdraw-success": "#4ade80",
  pending: "#facc15",
  processing: "#facc15",
  failed: "#f87171",
  "withdraw-failed": "#f87171",
  cancelled: "#9ca3af",
  default: "#9ca3af",
};

// ✅ Map transaction status to icon
export const getStatusIcon = (status: string) => {
  switch (status) {
    case "success":
    case "withdraw-success":
      return "checkmark-circle";
    case "failed":
    case "withdraw-failed":
      return "close-circle";
    case "processing":
    case "pending":
      return "time";
    case "cancelled":
      return "ban";
    default:
      return "help-circle";
  }
};

export const getTransactionColor = (
  transactionType?: string,
  status?: string
) => {
  const type = (transactionType || "").toLowerCase();
  if (type === "sent") return "#ef4444"; // outgoing
  if (type === "received") return "#22c55e"; // incoming
  return (
    statusColors[(status || "default").toLowerCase()] ?? statusColors.default
  );
};

// Status label color (always map by status, e.g., success -> #4ade80)
export const getStatusTextColor = (status?: string) => {
  const normalized = (status || "default").toLowerCase();
  return statusColors[normalized] ?? statusColors.default;
};
