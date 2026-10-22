import { prisma } from "../lib/prisma";

// Applies the new look's colours to an EXISTING database without touching your text, photos or projects.
const COLORS: Record<string, [string, string]> = {
  branding: ["#86cff8", "#5aa9e6"],
  "ui-ux-design": ["#7fd6a2", "#47b075"],
  "product-design": ["#f7d768", "#d9b236"],
  development: ["#f1ae5c", "#df8a2e"],
  "graphic-design": ["#ea7b72", "#cc4f47"],
  "social-media-design": ["#b062cf", "#8a3fae"],
  "digital-marketing": ["#a98676", "#85604f"],
  "motion-design": ["#444444", "#1f1f1f"],
};

async function main() {
  await prisma.siteSettings.update({ where: { id: 1 }, data: { bgColor: "#ffffff", accentColor: "#0a0a0a" } });
  let n = 0;
  for (const [slug, [color1, color2]] of Object.entries(COLORS)) {
    const r = await prisma.category.updateMany({ where: { slug }, data: { color1, color2 } });
    n += r.count;
  }
  console.log(`Page colours reset to the new look, ${n} folder colours updated.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
