"use client";

import { useEffect, type ReactNode } from "react";
import type {
  WebMcpModelContext,
  WebMcpToolDefinition,
  WebMcpToolResult,
} from "@/lib/webmcp";
import { SITE_PATHS } from "@/lib/site-config";

export interface WebMcpProviderProps {
  businessName: string;
  tools: WebMcpToolDefinition[];
  endpoint?: string;
  children?: ReactNode;
}

type WindowWithModelContext = Window & {
  modelContext?: WebMcpModelContext;
};

type NavigatorWithModelContext = Navigator & {
  modelContext?: WebMcpModelContext;
};

function asErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown WebMCP tool error";
}

/**
 * Injects tool definitions onto window/navigator.modelContext for
 * browser-native AI agents. Manifest lives at /.well-known/mcp.json
 * (linked from the document head). Tools execute locally from public
 * site facts — there is no /api/agent-action endpoint.
 */
export function WebMcpProvider({
  businessName,
  tools,
  endpoint = SITE_PATHS.mcp,
  children,
}: WebMcpProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const normalizedNamespace = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const win = window as WindowWithModelContext;
    const nav = navigator as NavigatorWithModelContext;
    const existingContext = win.modelContext || nav.modelContext;

    const formattedTools = tools.map((tool) => ({
      name: `${normalizedNamespace}_${tool.name}`,
      description: tool.description,
      inputSchema: tool.parameters,
      call: async (args: Record<string, unknown>): Promise<WebMcpToolResult> => {
        try {
          return await tool.execute(args);
        } catch (err: unknown) {
          return { status: "error", message: asErrorMessage(err) };
        }
      },
    }));

    const updatedContext: WebMcpModelContext = {
      version: "1.0.0",
      businessName,
      endpoint,
      tools: [...(existingContext?.tools ?? []), ...formattedTools],
    };

    win.modelContext = updatedContext;
    nav.modelContext = updatedContext;
  }, [businessName, tools, endpoint]);

  return <>{children}</>;
}

export default WebMcpProvider;
