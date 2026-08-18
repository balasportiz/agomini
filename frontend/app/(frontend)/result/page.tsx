import { permanentRedirect } from "next/navigation";

export default function LegacyResultPage() {
  permanentRedirect("/results");
}
