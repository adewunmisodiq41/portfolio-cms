import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const CATEGORIES = [
  { name: "Branding", slug: "branding", color1: "#ff8a5b", color2: "#e5663a", intro: "Identities, logos and brand systems built to be remembered." },
  { name: "UI/UX Design", slug: "ui-ux-design", color1: "#6c8cff", color2: "#4a68de", intro: "Interfaces designed around real user needs." },
  { name: "Product Design", slug: "product-design", color1: "#9b7bff", color2: "#7a58e6", intro: "End-to-end product thinking, from concept to launch." },
  { name: "Development", slug: "development", color1: "#27c28a", color2: "#16a070", intro: "Clean, fast builds that match the design." },
  { name: "Graphic Design", slug: "graphic-design", color1: "#ffc94a", color2: "#e8a915", intro: "Posters, flyers, banners and print-ready work." },
  { name: "Social Media Design", slug: "social-media-design", color1: "#ff6fa5", color2: "#e04a85", intro: "Scroll-stopping visuals for every platform." },
  { name: "Digital Marketing", slug: "digital-marketing", color1: "#35c4e0", color2: "#1ba3c0", intro: "Campaign creative that supports growth." },
  { name: "Motion Design", slug: "motion-design", color1: "#ff5d5d", color2: "#d93f3f", intro: "Animated brand stories and motion graphics." },
];

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 10) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ characters) in .env before seeding.");
  }

  // Admin user: create if missing; only overwrite the password when RESET_ADMIN_PASSWORD=1
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (!existing) {
    await prisma.adminUser.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`Created admin user ${email}`);
  } else if (process.env.RESET_ADMIN_PASSWORD === "1") {
    await prisma.adminUser.update({ where: { email }, data: { passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`Reset password for ${email}`);
  } else {
    console.log(`Admin ${email} already exists (set RESET_ADMIN_PASSWORD=1 to reset the password)`);
  }

  // Content: only seed an empty database so re-running never overwrites your edits
  const hasContent = (await prisma.category.count()) > 0;
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Your Name",
      title: "Creative Designer",
      location: "Your City",
      bio: "I help businesses turn complex ideas into design that solves real problems. Every project is built to sharpen your brand, make things easier to use, and connect you with the people who matter most. From first sketch to final launch, I stay close to every detail.",
      bookingUrl: `mailto:${email}`,
      ratingScore: "",
      ratingText: "",
      showRating: false,
      footerText: "All rights reserved.",
    },
  });
  if (hasContent) {
    console.log("Content already present, skipped sample data.");
    return;
  }

  await prisma.stat.createMany({
    data: [
      { value: "00", label: "Years of experience", order: 0 },
      { value: "00+", label: "Projects completed", order: 1 },
      { value: "00%", label: "Satisfied clients", order: 2 },
    ],
  });
  await prisma.socialLink.createMany({
    data: [
      { label: "Fb", name: "Facebook", url: "https://www.facebook.com/", order: 0 },
      { label: "X", name: "X", url: "https://x.com/", order: 1 },
      { label: "Ig", name: "Instagram", url: "https://www.instagram.com/", order: 2 },
      { label: "In", name: "LinkedIn", url: "https://www.linkedin.com/", order: 3 },
    ],
  });
  for (const [i, c] of CATEGORIES.entries()) {
    const category = await prisma.category.create({ data: { ...c, order: i } });
    await prisma.project.createMany({
      data: [
        { categoryId: category.id, title: "Sample project one", meta: "2026", description: "Replace this with your own project from the admin dashboard.", order: 0 },
        { categoryId: category.id, title: "Sample project two", meta: "2026", description: "Replace this with your own project from the admin dashboard.", tall: true, order: 1 },
      ],
    });
  }
  console.log("Seeded sample content.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
