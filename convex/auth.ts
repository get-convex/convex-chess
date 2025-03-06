import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Password({
      validatePasswordRequirements: (password) => {
        if (process.env.ALLOW_PASSWORD_LOGIN !== "true") {
          throw new Error("Password login is not allowed");
        }
        return password;
      },
      profile: (params, ctx) => {
        return {
          email: params.email as string,
          name: params.email as string,
        };
      },
    }),
  ],
});
