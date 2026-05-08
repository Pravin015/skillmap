// NextAuth config — three sign-in methods:
//   1. Credentials (email + password, original)
//   2. Google OAuth (auto-creates STUDENT account on first sign-in)
//   3. LinkedIn OAuth (same — pulls name + email + photo)
//
// On first OAuth sign-in we auto-provision:
//   - User row (role=STUDENT, password=random hash they'll never use)
//   - StudentProfile row (linked, profileNumber generated)
// so the user lands directly on /dashboard or /onboarding without an
// extra account-creation step.

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { generateProfileNumber } from "./profile-number";

const HAS_GOOGLE = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const HAS_LINKEDIN = Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);

// LinkedIn moved to OIDC — the new "Sign In with LinkedIn using OpenID
// Connect" product gives us name + email + picture via standard OIDC
// scopes. Old r_liteprofile is deprecated.
const linkedinProviderConfig = HAS_LINKEDIN
  ? LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      // OIDC scopes — required by LinkedIn's new product. Granted
      // automatically when you enable "Sign In with LinkedIn using
      // OpenID Connect" in the LinkedIn Developer console.
      authorization: { params: { scope: "openid profile email" } },
      issuer: "https://www.linkedin.com/oauth",
      jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
      // Custom profile mapping — LinkedIn's OIDC userinfo endpoint
      // returns slightly different field names than the default.
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    })
  : null;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        if (credentials.role && credentials.role !== user.role && user.role !== "ADMIN") {
          throw new Error(`This account is registered as ${user.role}, not ${credentials.role}`);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
    // Conditionally include OAuth providers — keeps dev environments
    // without OAuth env vars from crashing.
    ...(HAS_GOOGLE
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Pull profile picture in addition to default name+email.
            authorization: {
              params: { scope: "openid profile email", prompt: "consent" },
            },
          }),
        ]
      : []),
    ...(linkedinProviderConfig ? [linkedinProviderConfig] : []),
  ],

  callbacks: {
    // Runs on every OAuth sign-in. We use this to auto-provision a
    // User row (with role STUDENT by default) plus a linked
    // StudentProfile, then update the existing User's avatar if the
    // OAuth provider has a fresher one.
    async signIn({ user, account, profile }) {
      // Credentials path doesn't hit this hook in the same way — skip.
      if (account?.provider === "credentials") return true;

      const email = user.email?.toLowerCase().trim();
      if (!email) {
        console.error("[auth] OAuth sign-in missing email");
        return "/auth/login?error=NoEmail";
      }

      try {
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
          // Top up the avatar if the user previously had none.
          if (!existing.profileImage && user.image) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { profileImage: user.image },
            });
          }
          // Stash the resolved internal id so jwt callback can pick it up.
          (user as { id?: string }).id = existing.id;
          (user as { role?: string }).role = existing.role;
          return true;
        }

        // First-time OAuth sign-in — create User + StudentProfile.
        // Password is a random unguessable string the user will never see;
        // they always sign in via OAuth. If they later want to set a real
        // password, /auth/forgot-password works as the recovery path.
        const randomPwd = await bcrypt.hash(
          Math.random().toString(36) + Date.now().toString(36),
          12
        );

        const created = await prisma.user.create({
          data: {
            name: user.name || (profile as { name?: string })?.name || email.split("@")[0],
            email,
            password: randomPwd,
            role: "STUDENT",
            profileImage: user.image || null,
          },
        });

        await prisma.studentProfile
          .create({
            data: {
              userId: created.id,
              profileNumber: generateProfileNumber(),
              // We can pull more from LinkedIn later via a profile-enrich
              // endpoint; for now, just leave optional fields blank.
            },
          })
          .catch((err) => {
            // StudentProfile is non-critical for sign-in — log + continue.
            console.error("[auth] StudentProfile auto-create failed:", err);
          });

        (user as { id?: string }).id = created.id;
        (user as { role?: string }).role = "STUDENT";
        return true;
      } catch (err) {
        console.error("[auth] signIn callback error:", err);
        return "/auth/login?error=OAuthCallback";
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role?: string }).role;
        token.id = (user as unknown as { id?: string }).id;
        token.mustChangePassword = (user as unknown as { mustChangePassword?: boolean }).mustChangePassword;
      }
      // For OAuth flow, role/id may not be on `user` yet on subsequent
      // calls — re-hydrate from DB if missing.
      if (!token.role && token.email) {
        const fresh = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.id = fresh.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { mustChangePassword?: boolean }).mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
