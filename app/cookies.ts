import { createCookie } from "@remix-run/node";

export const userIdCookie = createCookie("userId", {
  maxAge: 60 * 60 * 24 * 7, 
  httpOnly: true,
  path: "/",
  sameSite: "lax",
});
