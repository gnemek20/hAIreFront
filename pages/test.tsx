import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Test = () => {
  const router = useRouter();

  const clientId = "Ov23liiTe3A04MrvYsMQ";
  const redirect = "http://localhost/test";
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

  return (
    <div>
      <button onClick={() => router.push(githubAuthUrl)}>login</button>
      <button onClick={handleCreateRepo}>sansing</button>
    </div>
  );
};

export default Test;