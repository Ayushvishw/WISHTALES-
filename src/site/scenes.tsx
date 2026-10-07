import { Obj, type ObjName } from "@/story/obj";

/** Animated illustrations, one per occasion. Animation lives in site.css under .scene-*. */

export const OCCASION_LOOK: Record<string, { a: string; b: string; line: string; blurb: string }> = {
  birthday: { a: "#ff6b9a", b: "#ffc861", line: "Balloons, games, candles and a letter they open one surprise at a time.", blurb: "10 templates" },
  anniversary: { a: "#ff4d6d", b: "#ffb4a2", line: "Count every day together, relive your story, and lock your love on a bridge.", blurb: "5 templates" },
  friendship: { a: "#4fd1c5", b: "#ffd166", line: "Inside jokes, old photos, and a thank-you they won't forget.", blurb: "Coming soon" },
  proposal: { a: "#b388ff", b: "#ff8fab", line: "Build up to the question with a ring box and a love meter. They can only say yes.", blurb: "5 templates" },
  invitations: { a: "#d4af37", b: "#ff8fab", line: "Wedding, engagement, party and housewarming invites that open like a gift, with directions and guest replies.", blurb: "8 templates" },
  wedding: { a: "#ff9f1c", b: "#e63946", line: "Blessings, memories and a toast from far away.", blurb: "Coming soon" },
  "mothers-day": { a: "#ff8fab", b: "#ffd6a5", line: "Thank her for everything, in her favourite colours.", blurb: "Coming soon" },
  "fathers-day": { a: "#5aa9e6", b: "#7fc8a9", line: "For the man who never says it first.", blurb: "Coming soon" },
};

/** Each occasion's single hero object, shown alone on a soft glow. */
const SCENE_OBJECT: Record<string, ObjName> = {
  birthday: "birthday_cake",
  anniversary: "two_hearts",
  proposal: "ring",
  friendship: "teddy_bear",
  invitations: "envelope",
  wedding: "bouquet",
  "mothers-day": "tulip",
  "fathers-day": "trophy",
};

export function Scene({ slug }: { slug: string }) {
  const obj = SCENE_OBJECT[slug];
  if (!obj) return null;
  return (
    <div className={`scene scene3d scene-${slug}`} aria-hidden="true">
      <i className="s3-glow" />
      <Obj name={obj} size={220} className="s3 s3-hero" />
    </div>
  );
}
