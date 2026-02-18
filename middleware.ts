import { NextRequest, NextResponse } from "next/server";

const middleware = (req: NextRequest) => {
  const auth = req.cookies.get("access_token");

  if (!auth) {
    const signinURL = new URL("/auth/signin", req.url);
    const currentSearchParams = new URL(req.url).search;

    signinURL.search = currentSearchParams;
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