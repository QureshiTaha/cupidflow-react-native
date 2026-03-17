import moment from "moment";

export const formatCoins = (num: number): string => {
  if (num >= 1_000_000_000)
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (num >= 10_000_000)
    return (num / 10_000_00).toFixed(1).replace(/\.0$/, "") + "Cr";
  if (num >= 100_000)
    return (num / 100_000).toFixed(1).replace(/\.0$/, "") + "L";

  if (num >= 1000) {
    const val = num / 1000;
    return (Math.floor(val * 10) / 10).toString().replace(/\.0$/, "") + "k";
  }

  return num.toLocaleString();
};

export const formatFullDate = (date: string | Date) => {
  if (!date) return "";
  return moment(date).format("DD MMM YYYY, hh:mm A");
};

export const getRecentMessagePreview = (msg: any) => {
  if (!msg) return "";
  const text = String(msg).trim();
  // gift payload support (e.g., {"type":"gift","amount":10})
  try {
    const p = JSON.parse(text);
    if (p?.type === "gift" && p?.amount != null) {
      return `Gift • ${p.amount} coin${Number(p.amount) === 1 ? "" : "s"}`;
    }
  } catch {}

  const isUrl = /^https?:\/\//i.test(text);
  if (!isUrl) return text;

  const lower = text.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif)$/.test(lower)) return "📸 Photo";
  if (/\.(mp4|mov|mkv|webm)$/.test(lower)) return "🎥 Video";
  if (/\.(mp3|wav|m4a|aac|ogg)$/.test(lower)) return "🎤 Audio";
  if (/\.pdf$/.test(lower)) return "PDF";
  if (/\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/.test(lower)) return "Document";
  return "Media";
};
