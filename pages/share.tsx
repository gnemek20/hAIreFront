// ── React / Next ──
import React, { ChangeEvent, DragEvent, MouseEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

// ── External Libraries ──
import clsx from "clsx";
import { toast } from "sonner";

// ── Internal Modules ──
import TopSticky from "@/components/TopSticky";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useUser } from "@/contexts/UserContext";
import { AgentType } from "@/types/agentTypes";
import { ApiError, agentApi, userApi } from "@/utils/api";

// ── Styles ──
import styles from "@/styles/pages/share.module.css";

const ICON_BOX = {
  src: require("@/public/assets/box.svg"),
  alt: "box"
};

const ICON_UPLOAD = {
  src: require("@/public/assets/upload.svg"),
  alt: "upload"
};

const ICON_DOWNLOAD = {
  src: require("@/public/assets/download.svg"),
  alt: "download"
};

const ICON_FILE = {
  src: require("@/public/assets/file.svg"),
  alt: "file"
};

const TEST_YAML = `# ==============================================================================
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
  // ── Hooks ──
  const router = useRouter();
  const user = useUser();
  const subscriptions = useSubscriptions();

  // ── Refs ──
  const inputRef = useRef<HTMLInputElement>(null);

  // ── State ──
  const [file, setFile] = useState<File | null>(null);

  const [githubURL, setGithubURL] = useState<string>("");
  const [generatedYaml, setGeneratedYaml] = useState<string>("");

  const [userAgents, setUserAgents] = useState<AgentType[][]>([]);

  const [activePage, setActivePage] = useState<number>(1);
  
  const [isFileDragging, setIsFileDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAgentsLoading, setIsAgentsLoading] = useState<boolean>(true);

  // ── Helpers ──
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

  const removeFile = () => {
    if (!inputRef.current) return;

    inputRef.current.value = "";
    setFile(null);
  };

  const downloadYaml = (content: string, filename="haire.yaml") => {
    const blob = new Blob([content], {
      type: "text/yaml;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Data Fetching ──
  const fetchUserAgents = async () => {
    if (!user.token) return;

    try {
      const data = await userApi.getUserAgents(user.token);

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
    }
    finally {
      setIsAgentsLoading(false);
    };
  };

  const saveUserAgent = async (newAgent: AgentType) => {
    if (!user.token) return;

    try {
      const data = await userApi.postUserAgent(user.token, newAgent);

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
    };
  };
  
  const deleteUserAgent = async (targetAgent: AgentType) => {
    if (!user.token) return;

    try {
      await userApi.deleteUserAgent(user.token, targetAgent);

      toast.success("Agent deleted.");
      handleDeleteUserAgent(targetAgent);

      if (subscriptions.subs.includes(targetAgent.slug)) unSubscribeAgent(targetAgent.slug);
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Delete user agent failed:", error.data);
        toast.error(`Delete user agent failed: ${error.message}`);
        return;
      }

      window.alert("Server error");
      router.reload();
    };
  };

  const unSubscribeAgent = async (targetSlug: AgentType["slug"]) => {
    if (!user.token) return;

    try {
      await userApi.unsubscribe(user.token, targetSlug);

      subscriptions.setSubs(prev => prev.filter(slug => slug !== targetSlug));
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Unsubscribe failed:", error.data);
        toast.error(`Unsubscribe failed: ${error.message}`);
        return;
      }

      window.alert("Server error");
      router.reload();
    }
  };

  const deployAgent = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);

    try {
      const data = await agentApi.deploy(file);

      const { status, ...deployedAgent } = data;
      await saveUserAgent(deployedAgent);
    }
    catch (error) {
      if (error instanceof ApiError) {
        console.error("Deploy failed:", error.data);
        toast.error(`Deploy failed: ${error.message}`);
        return;
      }

      window.alert("Server error");
      router.reload();
    }
    finally {
      setIsUploading(false);
    };
  };

  const deleteAgent = async (targetAgent: AgentType) => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await agentApi.deleteAgent(targetAgent.slug);

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
    }
    finally {
      setIsDeleting(false);
    };
  };

  // ── Handlers ──
  const handleSelectPage = (newPage: number, event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/share?page=${newPage}`, "_blank");
      return;
    }

    router.push({
      pathname: router.pathname,
      query: { page: newPage }
    }, undefined, { shallow: true });
  };

  const handleGenerateYaml = async () => {
    if (!githubURL || isGenerating) return;
    setIsGenerating(true);

    try {
      const data = await agentApi.generateYaml(githubURL);

      setGeneratedYaml(data.yaml);
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

  const handleDownloadYaml = () => {
    downloadYaml(generatedYaml);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>, callback: (str: string) => void) => {
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

  // ── Effects ──
  useEffect(() => {
    if (!file) return;
    toast.success(`File selected: ${file.name}`);
  }, [file]);
  
  useEffect(() => {
    const page = router.query["page"] as string;
    if (page) setActivePage(parseInt(page));
  }, [router.query]);

  useEffect(() => {
    if (!user.hasAuth()) {
      router.push({
        pathname: "/signin",
        query: { redirect: router.pathname }
      });

      return;
    }

    fetchUserAgents();
  }, [user.token]);

  return (
    <React.Fragment>
      <TopSticky />
      <div className={clsx(styles["share-background"])} />

      <div className={clsx(styles["share-section"])}>
        <div className={clsx(styles["share-section-inner"])}>

          {/* ── Page Title ── */}
          <div className={clsx(styles["page-title"])}>
            <div>
              <Image src={ICON_BOX.src} alt={ICON_BOX.alt} />
              <h1>Share Agent</h1>
            </div>
            <div>
              <p>Share the Agent you created on the Marketplace.</p>
            </div>
          </div>

          {/* ── Share Layout ── */}
          <div className={clsx(styles["share-layout"])}>

            {/* Left: Upload & YAML Generator */}
            <div className={clsx(styles["share-left"])}>
              <div className={clsx(styles["share-left-sticky"])}>

                {/* Upload Section */}
                <div className={clsx(styles["upload-wrapper"])}>
                  <div className={clsx(styles["upload-container"])}>
                    <div className={clsx(styles["upload-title"])}>
                      <Image src={ICON_UPLOAD.src} alt={ICON_UPLOAD.alt} />
                      <h4>upload new Agent</h4>
                    </div>
                    <div className={clsx(styles["upload-file"])}>
                      <label
                        className={clsx({ [styles["file-drop--dragging"]]: isFileDragging })}
                        htmlFor="file"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div
                          className={clsx(styles["file-upload-icon"], {
                            [styles["file-upload-icon--uploaded"]]: file,
                          })}
                        >
                          {file
                            ? <Image src={ICON_FILE.src} alt={ICON_FILE.alt} />
                            : <Image src={ICON_UPLOAD.src} alt={ICON_UPLOAD.alt} />
                          }
                        </div>
                        {file ? (
                          <React.Fragment>
                            <h4>{file.name}</h4>
                            <p>{`${(file.size / 1024 / 1024).toFixed(2)}MB`}</p>
                            <button onClick={handleRemoveFile}>Remove File</button>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <h4>drag ZIP file</h4>
                            <p>or click to select file</p>
                          </React.Fragment>
                        )}
                      </label>
                      <input
                        ref={inputRef}
                        id="file"
                        type="file"
                        accept="application/zip"
                        onChange={handleChangeFile}
                      />
                      <button
                        className={clsx({ [styles["upload-btn--loading"]]: isUploading })}
                        disabled={!file || isUploading}
                        onClick={deployAgent}
                      >
                        <Image src={ICON_UPLOAD.src} alt={ICON_UPLOAD.alt} />
                        <p>{isUploading ? "Sharing Agent..." : "Share Agent"}</p>
                      </button>
                    </div>
                    <div className={clsx(styles["upload-notice"])}>
                      <p>ZIP file must include an agent.yaml file. Basic information will be automatically extracted from the YAML file.</p>
                    </div>
                  </div>
                </div>

                {/* YAML Generator */}
                <div className={clsx(styles["yaml-generator"])}>
                  <div className={clsx(styles["generator-title"])}>
                    <Image src={ICON_DOWNLOAD.src} alt={ICON_DOWNLOAD.alt} />
                    <h4>YAML Generator</h4>
                  </div>
                  <p className={clsx(styles["generator-desc"])}>
                    Paste a GitHub repo URL to auto-generate an agent.yaml config file.
                  </p>
                  <div className={clsx(styles["generator-input"])}>
                    <input
                      type="text"
                      placeholder="https://github.com/user/repo"
                      value={githubURL}
                      onChange={(event) => handleInputChange(event, setGithubURL)}
                    />
                    <button disabled={isGenerating} onClick={handleGenerateYaml}>
                      {isGenerating ? "Generating..." : "Generate"}
                    </button>
                  </div>
                  {generatedYaml && (
                    <div className={clsx(styles["yaml-downloader"])} onClick={handleDownloadYaml}>
                      <div className={clsx(styles["yaml-file-name"])}>
                        <Image src={ICON_FILE.src} alt={ICON_FILE.alt} />
                        <p>haire.yaml</p>
                      </div>
                      <div className={clsx(styles["yaml-download-btn"])}>
                        <Image src={ICON_DOWNLOAD.src} alt={ICON_DOWNLOAD.alt} />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right: My Agents */}
            <div className={clsx(styles["share-right"])}>
              <div className={clsx(styles["my-agents-title"])}>
                <Image src={ICON_BOX.src} alt={ICON_BOX.alt} />
                <h4>{`My Agents (${userAgents.flat().length})`}</h4>
              </div>

              {/* Agent Grid */}
              <div className={clsx(styles["agent-grid"])}>
                {isAgentsLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className={clsx(styles["skeleton-agent-card"])}>
                      <div className={clsx(styles["skeleton-agent-left"])}>
                        <div className={clsx(styles["skeleton-line"], styles["skeleton-icon"])} />
                        <div className={clsx(styles["skeleton-line"], styles["skeleton-name"])} />
                        <div className={clsx(styles["skeleton-line"], styles["skeleton-version"])} />
                      </div>
                      <div className={clsx(styles["skeleton-agent-right"])}>
                        <div className={clsx(styles["skeleton-line"], styles["skeleton-slug"])} />
                        <div className={clsx(styles["skeleton-line"], styles["skeleton-desc"])} />
                      </div>
                    </div>
                  ))
                ) : (
                  userAgents?.[activePage - 1]?.map((agent, idx) => (
                  <div key={idx} className={clsx(styles["agent-card"])}>
                    <div className={clsx(styles["agent-card-header"])}>
                      <div className={clsx(styles["agent-card-icon"])}>{agent.icon}</div>
                      <div className={clsx(styles["agent-card-info"])}>
                        <h4 className={clsx(styles["agent-card-name"])}>{agent.name}</h4>
                        <p className={clsx(styles["agent-card-slug"])}>{agent.slug}</p>
                      </div>
                      <div className={clsx(styles["agent-version"])}>
                        <p>{agent.version}</p>
                      </div>
                    </div>
                    <div className={clsx(styles["agent-card-content"])}>
                      <p>{agent.description}</p>
                    </div>
                    <div className={clsx(styles["agent-card-actions"])}>
                      <div className={clsx(styles["agent-card-price"])}>
                        <p>{`$${String(agent.price).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`}</p>
                      </div>
                      <button
                        className={clsx(styles["btn-delete"])}
                        disabled={isDeleting}
                        onClick={() => deleteAgent(agent)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
                )}
              </div>

              {/* Pagination */}
              {userAgents.length > 1 && (
                <div className={clsx(styles["pagination"])}>
                  {userAgents.map((_, idx) => (
                    <div
                      key={idx}
                      className={clsx({
                        [styles["pagination-item--active"]]: activePage === idx + 1,
                      })}
                      onClick={(event) => handleSelectPage(idx + 1, event)}
                    >
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