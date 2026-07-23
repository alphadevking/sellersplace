/**
 * Sizes a known image host (Cloudinary uploads, Unsplash seed data) to exact
 * social-card dimensions via URL transforms — crawlers get a fast, correctly
 * cropped JPEG instead of a multi-MB original. Unknown hosts pass through.
 */
export function ogSized(url: string, w: number, h: number): string {
  try {
    const u = new URL(url);
    if (u.hostname === "res.cloudinary.com" && u.pathname.includes("/upload/")) {
      u.pathname = u.pathname.replace(
        "/upload/",
        `/upload/w_${w},h_${h},c_fill,f_jpg,q_auto/`
      );
      return u.toString();
    }
    if (u.hostname === "images.unsplash.com") {
      u.searchParams.set("w", String(w));
      u.searchParams.set("h", String(h));
      u.searchParams.set("fit", "crop");
      u.searchParams.set("fm", "jpg");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}
