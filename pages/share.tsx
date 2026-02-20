import TopSticky from "@/components/TopSticky";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useUser } from "@/contexts/UserContext";
import styles from "@/styles/pages/share.module.css";
import { AgentType } from "@/types/agentTypes";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { ChangeEvent, DragEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const box_icon = {
  src: require("@/public/assets/box.svg"),
  alt: "box"
};

const upload_icon = {
  src: require("@/public/assets/upload.svg"),
  alt: "upload"
};

const file_icon = {
  src: require("@/public/assets/file.svg"),
  alt: "file"
};

const Share = () => {
  const router = useRouter();
  const user = useUser();
  const subscriptions = useSubscriptions();

  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [myAgents, setMyAgents] = useState<AgentType[][]>([]);

  const [toggledPage, setToggledPage] = useState<number>(1);
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const changePage = (newPage: number) => {
    router.push({
      pathname: router.pathname,
      query: { page: newPage }
    }, undefined, { shallow: true });
  };

  const sliceArray = (arr: AgentType[], size = 6): AgentType[][] => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }

    return result;
  };

  const computeAgents = (candidates: AgentType[]) => {
    const sliced = sliceArray(candidates);
    setMyAgents(sliced);
  };

  const postUserAgent = async (newAgent: AgentType) => {
    if (user.token === "") return;
    
    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (!serverURL) return;

    try {
      const res = await fetch(`${serverURL}/users/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: user.token,
          agent: newAgent
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        const finalAgents = [...myAgents.flat(), newAgent];
        computeAgents(finalAgents);
      }
      else {
        console.error(data);
      }
    } catch (error) {
      window.alert("Server error");
      // router.reload();
    }
  };
  
  const deleteUserAgent = async (targetSlug: AgentType["slug"]) => {
    // if (user.token === "") return;
    
    // const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    // if (!serverURL) return;
  
    // try {
    //   const res = await fetch(`${serverURL}/users/agents`, {
    //     method: "DELETE",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       access_token: user.token,
    //       slug: targetSlug
    //     })
    //   });
      
    //   const data = await res.json();
  
    //   if (res.ok) {
    //     const finalAgents = [...myAgents.flat().filter(ag => ag.slug !== targetSlug)];
    //     computeAgents(finalAgents);
    //     toast.success("Agent deleted.");
    //   }
    //   else {
    //     console.error("Delete user agent failed", data);
    //   }
    // } catch (error) {
    //   window.alert("Server error");
    //   // router.reload();
    // }
  }

  const getMyAgents = async () => {
    // if (user.token === "") return;

    // const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    // if (!serverURL) return;
    
    // try {
    //   const res = await fetch(`${serverURL}/users/agents/list`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       access_token: user.token
    //     })
    //   });
      
    //   const data = await res.json();
      
    //   if (res.ok) {
    //     computeAgents(data.agents);
    //   }
    //   else {
    //     console.error("Get failed", data.detail);
    //   }
    // } catch (error) {
    //   window.alert("Server error");
    //   router.reload();
    // }
  };

  const deployAgent = async () => {
    if (!file || isLoading) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;

    try {
      const res = await fetch(`${serverURL}/api/deploy`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.status === "deployed") {
        removeFile();
        toast.success("Agent uploaded.");
        const newAgent: AgentType = {
          slug: data.slug,
          name: data.name,
          version: data.version,
          description: data.description,
          price: data.price,
          icon: data.icon
        };

        // await postAgent(newAgent);
        const finalAgents = [...myAgents.flat(), newAgent];
        computeAgents(finalAgents);
      }
      else {
        console.error(data.detail);
        toast.error(`Upload failed: ${data.detail}`);
      }
    } catch (error) {
      window.alert("Deploy error");
      router.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAgent = async (slug: AgentType["slug"]) => {
    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;

    try {
      const res = await fetch(`${serverURL}/api/agents/${slug}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (data.status === "deleted") {
        // await deleteUserAgent(slug);
        const finalAgents = [...myAgents.flat().filter(ag => ag.slug !== slug)];
        computeAgents(finalAgents);
        toast.success("Agent deleted.");
      }
      else {
        console.error(data.detail);
        toast.error(`Delete failed: ${data.detail}`);
      }
    } catch (error) {
      window.alert("Delete error");
      router.reload();
    }
  };

  const removeFile = () => {
    if (!inputRef.current) return;

    inputRef.current.value = "";
    setFile(null);
  };

  const handleChangeFile = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const files = target.files;
    if (!files) return;

    const file = files[0];
    setFile(file);
  };

  const handleRemoveFile = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    removeFile();
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length === 0) return;

    const droppedFile = droppedFiles[0];

    if (droppedFile.type !== "application/zip" && !droppedFile.name.endsWith(".zip")) return;
    setFile(droppedFile);
  };

  useEffect(() => {
    if (!file) return;
    toast.success(`File selected: ${file.name}`);
  }, [file]);
  
  useEffect(() => {
    const page = router.query["page"] as string;
    if (page) setToggledPage(parseInt(page));
  }, [router.query]);

  useEffect(() => {
    if (!user.hasAuth()) {
      router.push({
        pathname: "/signin",
        query: { redirect: router.pathname }
      });

      return;
    }

    getMyAgents();
  }, [user.token]);

  return (
    <React.Fragment>
      <TopSticky />
      <div className={clsx(styles.background)} />
      <div className={clsx(styles.section)}>
        <div className={clsx(styles.sectionWrapper)}>
          <div className={clsx(styles.pageTitle)}>
            <div>
              <Image src={box_icon.src} alt={box_icon.alt} />
              <h1>Share Agent</h1>
            </div>
            <div>
              <p>Share the Agent you created on the Marketplace.</p>
            </div>
          </div>
          <div className={clsx(styles.sharing)}>
            <div className={clsx(styles.left)}>
              <div className={clsx(styles.leftWrapper)}>
                <div className={clsx(styles.leftContainer)}>
                  <div className={clsx(styles.shareTitle)}>
                    <Image src={upload_icon.src} alt={upload_icon.alt} />
                    <h4>upload new Agent</h4>
                  </div>
                  <div className={clsx(styles.shareFile)}>
                    <label className={clsx({ [styles.dragging]: isDragging })} htmlFor="file" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                      <div className={clsx(styles.fileUploadIcon, { [styles.fileUploaded]: file })}>
                        {file && (
                          <Image src={file_icon.src} alt={file_icon.alt} />
                        )}
                        {!file && (
                          <Image src={upload_icon.src} alt={upload_icon.alt} />
                        )}
                      </div>
                      {file && (
                        <React.Fragment>
                          <h4>{file.name}</h4>
                          <p>{`${(file.size / 1024 / 1024).toFixed(2)}MB`}</p>
                          <button onClick={handleRemoveFile}>Remove File</button>
                        </React.Fragment>
                      )}
                      {!file && (
                        <React.Fragment>
                          <h4>drag ZIP file</h4>
                          <p>or click to select file</p>
                        </React.Fragment>
                      )}
                    </label>
                    <input ref={inputRef} id="file" type="file" accept="application/zip" onChange={handleChangeFile} />
                    <button className={clsx({ [styles.loading]: isLoading })} disabled={!file || isLoading} onClick={deployAgent}>
                      <Image src={upload_icon.src} alt={upload_icon.alt} />
                      <p>{isLoading ? "Sharing Agent..." : "Share Agent"}</p>
                    </button>
                  </div>
                  <div className={clsx(styles.shareNotice)}>
                    <p>ZIP file must include an agent.yaml file. Basic information will be automatically extracted from the YAML file.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={clsx(styles.right)}>
              <div className={clsx(styles.myAgentsTitle)}>
                <Image src={box_icon.src} alt={box_icon.alt} />
                <h4>{`My Agents (${myAgents.flat().length})`}</h4>
              </div>
              <div className={clsx(styles.agents)}>
                {myAgents?.[toggledPage - 1]?.map((agent, idx) => (
                  <div className={clsx(styles.card)} key={idx}>
                    <div className={clsx(styles.cardLeft)}>
                      <p>{agent.icon}</p>
                      <div className={clsx(styles.agentVersion)}>
                        <p>{agent.version}</p>
                      </div>
                    </div>
                    <div className={clsx(styles.cardRight)}>
                      <div className={clsx(styles.cardTitle)}>
                        <h4>{agent.name}</h4>
                        <p>{agent.slug}</p>
                      </div>
                      <div className={clsx(styles.cardContent)}>
                        <p>{agent.description}</p>
                      </div>
                      <div className={clsx(styles.cardOption)}>
                        <div>
                          <button className={clsx(styles.subscribe, { [styles.subscribed]: subscriptions.subs.includes(agent.slug) })}>구독</button>
                          <button className={clsx(styles.use)}>사용</button>
                        </div>
                        <button className={clsx(styles.delete)} onClick={() => deleteAgent(agent.slug)}>삭제</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {myAgents.length > 1 && (
                <div className={clsx(styles.listIndex)}>
                  {myAgents.map((_, idx) => (
                    <div className={clsx({ [styles.toggledIndex]: toggledPage === idx + 1 })} onClick={() => changePage(idx + 1)} key={idx}>
                      <p>{idx + 1}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Share;