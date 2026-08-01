import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../lib/prisma.js";

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google account has no email"), null);
          }

          const existingByGoogle = await prisma.user.findFirst({
            where: { googleId: profile.id },
          });

          if (existingByGoogle && existingByGoogle.email !== email) {
            return done(new Error("Google account already linked to another user"), null);
          }

          let user = existingByGoogle;

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                email,
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value ?? null,
              },
            });
          } else {
            const existingByEmail = await prisma.user.findFirst({
              where: { email },
            });

            if (existingByEmail) {
              user = await prisma.user.update({
                where: { id: existingByEmail.id },
                data: {
                  googleId: profile.id,
                  name: profile.displayName,
                  avatarUrl: profile.photos?.[0]?.value ?? null,
                },
              });
            } else {
              user = await prisma.user.create({
                data: {
                  googleId: profile.id,
                  email,
                  name: profile.displayName,
                  avatarUrl: profile.photos?.[0]?.value ?? null,
                },
              });
            }
          }

          if (user.isBanned) {
            return done(null, false, { message: "This account has been banned" });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

export default passport;
