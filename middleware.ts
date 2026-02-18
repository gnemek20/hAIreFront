import { NextRequest, NextResponse } from "next/server";

const middleware = (req: NextRequest) => {
  const auth = req.cookies.get("access_token");

  if (!auth) {
    const signinURL = new URL("/auth/signin", req.url);

    const searchParams = new URL(req.url).searchParams;
    const category = searchParams.get("category");

    signinURL.search = `?category=${category === "find" ? "find" : "share"}`;
    return NextResponse.redirect(signinURL)
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/agent"
  ]
};

export default middleware;