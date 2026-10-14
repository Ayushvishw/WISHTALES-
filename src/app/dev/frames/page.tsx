import { notFound } from "next/navigation";
import { Frames } from "./Frames";

export const dynamic = "force-dynamic";

/** Local-only: draws chosen moments of a video design as stills, for checking the look. */
export default function FramesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Frames />;
}
