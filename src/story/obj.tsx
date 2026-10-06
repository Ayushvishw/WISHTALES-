import type { CSSProperties } from "react";

/**
 * Glossy 3D objects used for decoration across the site and the templates.
 * Images come from Microsoft's Fluent Emoji 3D set (MIT licence), stored in public/3d.
 */
export const OBJECTS = [
  "admission_tickets", "alarm_clock", "alien", "balloon", "bell", "birthday_cake",
  "blossom", "blue_heart", "bottle_with_popping_cork", "bouquet", "bubbles", "butterfly",
  "calendar", "camera", "camera_with_flash", "candle", "candy", "cherry_blossom",
  "chocolate_bar", "clinking_beer_mugs", "clinking_glasses", "cloud", "confetti_ball", "cookie",
  "coral", "crescent_moon", "crown", "crystal_ball", "cupcake", "desert_island",
  "diya_lamp", "dizzy", "doughnut", "dove", "envelope", "face_blowing_a_kiss",
  "fire", "fireworks", "flying_saucer", "four_leaf_clover", "framed_picture", "full_moon",
  "gem_stone", "glowing_star", "green_heart", "growing_heart", "headphone", "heart_with_arrow",
  "heart_with_ribbon", "herb", "hibiscus", "hot_beverage", "hourglass_done", "ice_cream",
  "joystick", "key", "kiss_mark", "leafy_green", "light_blue_heart", "locked",
  "lollipop", "love_letter", "magic_wand", "memo", "microphone", "milky_way",
  "mirror_ball", "musical_note", "musical_notes", "old_key", "orange_heart", "package",
  "paintbrush", "palm_tree", "party_popper", "partying_face", "pencil", "pink_heart",
  "postbox", "purple_heart", "rainbow", "red_heart", "red_paper_lantern", "revolving_hearts",
  "ribbon", "ring", "ringed_planet", "robot", "rocket", "rose",
  "scroll", "shaved_ice", "shooting_star", "shortcake", "smiling_face_with_hearts", "snowflake",
  "soft_ice_cream", "sparkler", "sparkles", "sparkling_heart", "spiral_shell", "star",
  "star_struck", "sun", "sunflower", "sunset", "teacup_without_handle", "tear_off_calendar",
  "teddy_bear", "ticket", "trophy", "tropical_drink", "tropical_fish", "tulip",
  "two_hearts", "unicorn", "video_game", "water_wave", "wedding", "white_heart",
  "wine_glass", "wrapped_gift", "yellow_heart",
] as const;

export type ObjName = (typeof OBJECTS)[number];

export function objSrc(name: ObjName) {
  return `/3d/${name}.webp`;
}

export function Obj({ name, size = 48, className, style, alt = "" }: { name: ObjName; size?: number; className?: string; style?: CSSProperties; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static decorations; next/image would add a wrapper and a request per size
    <img src={objSrc(name)} width={Math.round(size)} height={Math.round(size)} alt={alt} aria-hidden={alt ? undefined : true} draggable={false} decoding="async" className={`obj3d${className ? " " + className : ""}`} style={style} />
  );
}

/** The 3D objects that belong to each template's world: they float in the hero and crown each chapter title. */
export const SKIN_OBJECTS: Record<string, ObjName[]> = {
  starlit: ["crescent_moon", "glowing_star", "sparkling_heart", "balloon"],
  royal: ["crown", "rose", "gem_stone", "heart_with_ribbon"],
  arcade: ["joystick", "video_game", "trophy", "star_struck"],
  ocean: ["palm_tree", "tropical_fish", "spiral_shell", "tropical_drink"],
  garden: ["tulip", "butterfly", "cherry_blossom", "bouquet"],
  galaxy: ["ringed_planet", "rocket", "flying_saucer", "shooting_star"],
  desi: ["diya_lamp", "sunflower", "sparkler", "red_paper_lantern"],
  candy: ["lollipop", "doughnut", "cupcake", "candy"],
  gala: ["bottle_with_popping_cork", "trophy", "crown", "clinking_glasses"],
  scrapbook: ["camera", "framed_picture", "scroll", "pencil"],
  timeless: ["rose", "ring", "two_hearts", "love_letter"],
  diary: ["camera_with_flash", "framed_picture", "memo", "pencil"],
  moonlit: ["crescent_moon", "glowing_star", "sparkling_heart", "dizzy"],
  cafe: ["hot_beverage", "cookie", "rose", "wine_glass"],
  golden: ["trophy", "gem_stone", "clinking_glasses", "crown"],
  velvet: ["rose", "love_letter", "kiss_mark", "heart_with_ribbon"],
  nebula: ["ringed_planet", "shooting_star", "milky_way", "glowing_star"],
  blush: ["ring", "heart_with_arrow", "bouquet", "revolving_hearts"],
  neon: ["mirror_ball", "microphone", "sparkling_heart", "fireworks"],
  fairy: ["magic_wand", "butterfly", "cherry_blossom", "crystal_ball"],
};

export function skinObjects(skin?: string): ObjName[] {
  return (skin && SKIN_OBJECTS[skin]) || ["balloon", "wrapped_gift", "sparkles", "red_heart"];
}
