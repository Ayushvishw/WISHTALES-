import { Obj, type ObjName } from "@/story/obj";

/** Animated illustrations, one per occasion. Animation lives in site.css under .scene-*. */

export const OCCASION_LOOK: Record<string, { a: string; b: string; line: string; blurb: string }> = {
  birthday: { a: "#ff6b9a", b: "#ffc861", line: "Balloons, games, candles and a letter they open one surprise at a time.", blurb: "10 templates" },
  anniversary: { a: "#ff4d6d", b: "#ffb4a2", line: "Count every day together, relive your story, and lock your love on a bridge.", blurb: "5 templates" },
  friendship: { a: "#4fd1c5", b: "#ffd166", line: "Inside jokes, old photos, and a thank-you they won't forget.", blurb: "Coming soon" },
  proposal: { a: "#b388ff", b: "#ff8fab", line: "Build up to the question with a ring box and a love meter. They can only say yes.", blurb: "5 templates" },
  wedding: { a: "#ff9f1c", b: "#e63946", line: "Blessings, memories and a toast from far away.", blurb: "Coming soon" },
  "mothers-day": { a: "#ff8fab", b: "#ffd6a5", line: "Thank her for everything, in her favourite colours.", blurb: "Coming soon" },
  "fathers-day": { a: "#5aa9e6", b: "#7fc8a9", line: "For the man who never says it first.", blurb: "Coming soon" },
};

/** Each occasion's 3D still life: one hero object in front, two companions behind. */
const SCENE_OBJECTS: Record<string, [ObjName, ObjName, ObjName, ObjName]> = {
  birthday: ["birthday_cake", "balloon", "wrapped_gift", "party_popper"],
  anniversary: ["two_hearts", "clinking_glasses", "rose", "sparkles"],
  proposal: ["ring", "rose", "heart_with_ribbon", "sparkles"],
  friendship: ["teddy_bear", "camera", "four_leaf_clover", "party_popper"],
  wedding: ["wedding", "bouquet", "ring", "sparkles"],
  "mothers-day": ["bouquet", "teacup_without_handle", "sparkling_heart", "tulip"],
  "fathers-day": ["trophy", "hot_beverage", "crown", "sparkles"],
};

export function Scene({ slug }: { slug: string }) {
  const objs = SCENE_OBJECTS[slug];
  if (!objs) return null;
  return (
    <div className={`scene scene3d scene-${slug}`} aria-hidden="true">
      {objs.map((o, i) => <Obj key={o + i} name={o} size={i === 0 ? 200 : i === 3 ? 70 : 120} className={`s3 s3-${i}`} />)}
    </div>
  );
}
