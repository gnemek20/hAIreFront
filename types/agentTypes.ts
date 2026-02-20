export type CategoryType = "find" | "share" | "chat";

export interface AgentType {
  slug: string;
  name: string;
  description: string;
  version: string;
  price: number;
  icon: string;
};

export interface AgentDetailType {
  slug: AgentType["slug"];
  info: {
    slug: string;
    name: string;
    version: string;
    description: string;
    price: number;
    icon: string;
  };
  run: {
    engine: string;
    entry_point: string;
    dependencies: string;
  };
  resources: {
    llm: {
      provider: string;
      model: string;
      parameters: {
        temperature: number;
        max_tokens: number;
      };
    };
    auth: Array<{
      provider: string;
      service_name: string;
      scopes: string[];
    }>;
  };
  inputs: Array<{
    name: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    examples?: string[];
  }>;
  outputs: {
    view_type: string;
  };
  modelcard: string;
}