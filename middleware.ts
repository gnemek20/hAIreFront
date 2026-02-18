import { NextRequest, NextResponse } from "next/server";

const middleware = (req: NextRequest) => {
  const auth = req.cookies.get("access_token");

  if (!auth) {
    const currentSearchParams = new URL(req.url).searchParams;
    const signinURL = new URL("/auth/signin", req.url);

    currentSearchParams.forEach((value, key) => {
      signinURL.searchParams.set(key, value);
    });

    return NextResponse.redirect(signinURL);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/agent"
  ]
};

export default middleware;