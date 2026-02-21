import TopSticky from "@/components/TopSticky";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useUser } from "@/contexts/UserContext";
import styles from "@/styles/pages/share.module.css";
import { AgentType } from "@/types/agentTypes";
import { ApiError, apiFetch } from "@/utils/api";
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

const test_yaml = `# ==============================================================================
# hAIre Agent Configuration v1.1
# ==============================================================================

# 1. Identity
info:
  slug: "email-ghostwriter"
  name: "이메일 고스트라이터"
  version: "1.0.0"
  description: "읽지 않은 메일을 분석하고, 거절/수락 답장을 대신 작성해줍니다."
  price: 500
  icon: "📧"

# 2. Runtime
run:
  engine: "python-3.13"
  entry_point: "email_ghostwriter.main:main"
  dependencies: "requirements.txt"

# 3. Resources
resources:
  llm:
    provider: "openai"
    model: "gpt-5-mini-2025-08-07"
    parameters:
      temperature: 0.7
      max_tokens: 4096

  auth:
    - provider: "google"
      service_name: "gmail_access"
      scopes:
        - "gmail.readonly"
        - "gmail.compose"

# 4. Inputs
inputs:
  - name: "instruction"
    type: "text_area"
    label: "요청 사항"
    placeholder: "견적 요청 관련 메일 3개만 가져와"
    required: true
    examples:
      - "견적 요청 관련 메일 3개만 가져와"
      - "미팅 제안 메일"
      - "이번 주 온 메일 5개"

# 5. Outputs
outputs:
  view_type: "email_draft_list"
`;

const Share = () => {
  const router = useRouter();
  const user = useUser();
  const subscriptions = useSubscriptions();

  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [githubURL, setGithubURL] = useState<string>("");
  const [yaml, setYaml] = useState<string>("");

  const [userAgents, setUserAgents] = useState<AgentType[][]>([]);

  const [toggledPage, setToggledPage] = useState<number>(1);
  
  const [isFileDragging, setIsFileDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

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

  const sliceAgents = (agents: AgentType[]): AgentType[][] => {
    const sliced = sliceArray(agents);
    return sliced;
  };

  const handlePushUserAgent = (newAgent: AgentType) => {
    setUserAgents(prev => {
      const pushed: AgentType[] = [...prev.flat(), newAgent];
      const sliced: AgentType[][] = sliceAgents(pushed);

      return sliced;
    });
  };

  const handleDeleteUserAgent = (targetAgent: AgentType) => {
    setUserAgents(prev => {
      const deleted: AgentType[] = [...prev.flat().filter(agent => agent !== targetAgent)];
      const sliced: AgentType[][] = sliceAgents(deleted);

      return sliced;
    });
  }

  const getUserAgents = async () => {
    if (!user.token) return;

    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (!serverURL) return;

    try {
      const data = await apiFetch<{status: "success", agents: AgentType[]}>(`${serverURL}/users/agents/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: user.token
        })
      });

      for (const agent of data.agents) {
        handlePushUserAgent(agent);
      }
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Get user agents failed:", error.data);
        toast.error("Get agents failed");
        return;
      }

      window.alert("Server error");
      router.reload();
    };
  };

  const postUserAgent = async (newAgent: AgentType) => {
    if (!user.token) return;

    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (!serverURL) return;

    type PostUserAgentResponse =
      | {
        status: "success";
        inserted: true;
        agend_id: string;
      }
      | {
        status: "success";
        inserted: false;
        message: string;
      };

    try {
      const data = await apiFetch<PostUserAgentResponse>(`${serverURL}/users/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: user.token,
          agent: newAgent
        })
      });

      removeFile();
      
      if (!data.inserted) {
        toast.warning("Already deployed.");
        return;
      }

      toast.success("Agent deployed.");
      handlePushUserAgent(newAgent);
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Post user agent failed:", error.data);
        toast.error(`Post user agent failed: ${error.message}`);
        return;
      }

      window.alert("Server error");
      router.reload();
    }
    finally {
      setIsUploading(false);
    };
  };
  
  const deleteUserAgent = async (targetAgent: AgentType) => {
    if (!user.token) return;

    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (!serverURL) return;

    try {
      await apiFetch(`${serverURL}/users/agents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: user.token,
          agent: targetAgent
        })
      });

      toast.success("Agent deleted.");
      subscriptions.setSubs(prev => prev.filter(p => p !== targetAgent.slug));
      handleDeleteUserAgent(targetAgent);
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Delete user agent failed:", error.data);
        toast.error(`Delete user agent failed: ${error.message}`);
        return;
      }

      window.alert("Server error");
      router.reload();
    }
    finally {
      setIsDeleting(false);
    };
  };

  const deployAgent = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);

    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiFetch<{status: "deployed"} & AgentType>(`${serverURL}/api/deploy`, {
        method: "POST",
        body: formData
      });

      const { status, ...deployedAgent } = data;
      await postUserAgent(deployedAgent);
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Deploy failed:", error.data);
        toast.error(`Deploy failed: ${error.message}`);
        return;
      }

      window.alert("Server error");
      router.reload();
    };
  };

  const deleteAgent = async (targetAgent: AgentType) => {
    if (isDeleting) return;
    setIsDeleting(true);

    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;

    try {
      await apiFetch<{status: "deleted"}>(`${serverURL}/api/agents/${targetAgent.slug}`, {
        method: "DELETE"
      });

      await deleteUserAgent(targetAgent);
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Delete failed:", error.data);
        toast.error(`Delete failed: ${error.message}`);
        return;
      }

      window.alert("Server Error");
      router.reload();
    };
  };

  const removeFile = () => {
    if (!inputRef.current) return;

    inputRef.current.value = "";
    setFile(null);
  };

  const handleClickGenerateYaml = async () => {
    if (!githubURL || isGenerating) return;
    setIsGenerating(true);

    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;
    
    type GenerateYamlResponse = {
      status: "success";
      yaml: string;
      analysis: string;
      source: "generated" | "existing";
      repo: string;
      branch: string;
      files_analyzed: number;
    };

    try {
      const data = await apiFetch<GenerateYamlResponse>(`${serverURL}/api/generate-yaml`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github_url: githubURL
        })
      });

      console.log(data.yaml);
      setYaml(data.yaml);
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Generate failed:", error.data);
        toast.error(`Generate failed: ${error.message}`);
        return;
      }

      window.alert("Server error");
      router.reload();
    }
    finally {
      setIsGenerating(false);
    };
  };

  const handleChangeInput = (event: ChangeEvent<HTMLInputElement>, callback: (str: string) => void) => {
    const target = event.target;
    const value = target.value;

    callback(value);
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
    setIsFileDragging(true);
  };
  
  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsFileDragging(false);
  };
  
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsFileDragging(false);
    
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

    getUserAgents();
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
              <div className={clsx(styles.stickyLeft)}>
                <div className={clsx(styles.leftWrapper)}>
                  <div className={clsx(styles.leftContainer)}>
                    <div className={clsx(styles.shareTitle)}>
                      <Image src={upload_icon.src} alt={upload_icon.alt} />
                      <h4>upload new Agent</h4>
                    </div>
                    <div className={clsx(styles.shareFile)}>
                      <label className={clsx({ [styles.dragging]: isFileDragging })} htmlFor="file" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
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
                      <button className={clsx({ [styles.loading]: isUploading })} disabled={!file || isUploading} onClick={deployAgent}>
                        <Image src={upload_icon.src} alt={upload_icon.alt} />
                        <p>{isUploading ? "Sharing Agent..." : "Share Agent"}</p>
                      </button>
                    </div>
                    <div className={clsx(styles.shareNotice)}>
                      <p>ZIP file must include an agent.yaml file. Basic information will be automatically extracted from the YAML file.</p>
                    </div>
                  </div>
                </div>
                <div className={clsx(styles.yamlGenerator)}>
                  <div className={clsx(styles.generatorInput)}>
                    <input type="text" placeholder="Enter your Github URL..." value={githubURL} onChange={(event) => handleChangeInput(event, setGithubURL)} />
                    <button disabled={isGenerating} onClick={handleClickGenerateYaml}>
                      {isGenerating ? "Generating..." : "Generate"}
                    </button>
                  </div>
                  <div className={clsx(styles.yamlLog)}>
                    {yaml === "" && (
                      <p>The YAML will be displayed here.</p>
                    )}
                    {yaml !== "" && (
                      <p>{yaml}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={clsx(styles.right)}>
              <div className={clsx(styles.myAgentsTitle)}>
                <Image src={box_icon.src} alt={box_icon.alt} />
                <h4>{`My Agents (${userAgents.flat().length})`}</h4>
              </div>
              <div className={clsx(styles.agents)}>
                {userAgents?.[toggledPage - 1]?.map((agent, idx) => (
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
                          {/* <button className={clsx(styles.subscribe, { [styles.subscribed]: subscriptions.subs.includes(agent.slug) })}>구독</button>
                          <button className={clsx(styles.use)}>사용</button> */}
                        </div>
                        <button className={clsx(styles.delete)} disabled={isDeleting} onClick={() => deleteAgent(agent)}>삭제</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {userAgents.length > 1 && (
                <div className={clsx(styles.listIndex)}>
                  {userAgents.map((_, idx) => (
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