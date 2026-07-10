export default function SentimentLabel({ s }: { s: "positive" | "negative" | "neutral" }) {
  if (s === "positive") return <span className="text-good">sentiment positivo</span>;
  if (s === "negative") return <span className="text-bad">sentiment negativo</span>;
  return <span>sentiment neutro</span>;
}
