import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, signToken } from "../lib/auth.js";

const auth = new Hono();

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (pw.length > 72) return "Password must be at most 72 characters";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(pw)) return "Password must contain a number";
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\r\n"\\]/g, "").trim().slice(0, 200);
}

auth.post("/signup", async (c) => {
  const { email, password, fullName, orgName } = await c.req.json<{
    email: string;
    password: string;
    fullName: string;
    orgName: string;
  }>();

  if (!email || !password || !fullName || !orgName) {
    return c.json({ error: "All fields are required" }, 400);
  }
  if (!validateEmail(email)) return c.json({ error: "Invalid email format" }, 400);
  const pwErr = validatePassword(password);
  if (pwErr) return c.json({ error: pwErr }, 400);
  if (fullName.trim().length < 2 || fullName.trim().length > 100) return c.json({ error: "Invalid full name" }, 400);
  if (orgName.trim().length < 2 || orgName.trim().length > 100) return c.json({ error: "Invalid organization name" }, 400);

  const existing = await prisma.profile.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  // ensure slug uniqueness
  let attempt = 0;
  let finalSlug = slug;
  while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
    attempt++;
    finalSlug = `${slug}-${attempt}`;
    if (attempt > 20) return c.json({ error: "Could not generate unique organization slug" }, 500);
  }

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: orgName.trim(), slug: finalSlug } });
    const profile = await tx.profile.create({
      data: {
        id: crypto.randomUUID(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        passwordHash,
        organizationId: org.id,
        role: "admin",
      },
    });
    return { org, profile };
  });

  const token = signToken(result.profile.id, result.org.id);
  return c.json({
    token,
    user: {
      id: result.profile.id,
      email: result.profile.email,
      fullName: result.profile.fullName,
      avatarColor: result.profile.avatarColor,
      role: result.profile.role,
      organizationId: result.profile.organizationId,
    },
    organization: result.org,
  });
});

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();

  if (!email || !password) return c.json({ error: "Email and password are required" }, 400);

  const profile = await prisma.profile.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!profile) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  if (!profile.isActive) {
    return c.json({ error: "Account is deactivated" }, 403);
  }

  const valid = await bcrypt.compare(password, profile.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  if (!profile.organizationId) {
    return c.json({ error: "Account has no organization" }, 500);
  }

  await prisma.profile.update({ where: { id: profile.id }, data: { lastLoginAt: new Date() } });

  const token = signToken(profile.id, profile.organizationId);
  const organization = await prisma.organization.findUnique({ where: { id: profile.organizationId } });

  return c.json({
    token,
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      avatarColor: profile.avatarColor,
      role: profile.role,
      organizationId: profile.organizationId,
    },
    organization,
  });
});

auth.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");

  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile || !profile.isActive) {
    return c.json({ error: "User not found or deactivated" }, 404);
  }

  const { passwordHash: _, ...safeProfile } = profile;

  let organization = null;
  if (safeProfile.organizationId) {
    organization = await prisma.organization.findUnique({ where: { id: safeProfile.organizationId } });
    if (organization?.deletedAt) organization = null;
  }

  return c.json({ ...safeProfile, organization });
});

export default auth;
