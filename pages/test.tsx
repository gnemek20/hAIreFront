import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Test = () => {
  const router = useRouter();

  const clientId = "Ov23liGrcYSOiiGj1ZqU";
  const redirect = "https://hairefront.vercel.app/";
  const scope = "repo";

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(scope)}`;

  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const urlCode = router.query.code as string;
    if (urlCode) {
      setCode(urlCode);
    }
  }, [router.query]);

  const handleCreateRepo = async () => {
    if (!code) return;

    const res = await fetch("https://haireback.fly.dev/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    const data = await res.json();
    console.log(data);
  }

  const deleteGW = async () => {
    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;

    const slug = "email-ghostwriter-2";

    try {
      const res = await fetch((`${serverURL}/api/agents/${slug}`), {
        method: "DELETE"
      });

      const data = await res.json();
      console.log(data);
    } catch (error) {
      window.alert(error)
    };
  };

  return (
    <div>
      <button onClick={() => router.push(githubAuthUrl)}>login</button>
      <button onClick={handleCreateRepo}>sansing</button>
      <button onClick={deleteGW}>delete ghost writer</button>
    </div>
  );
};

export default Test;