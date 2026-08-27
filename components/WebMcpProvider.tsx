'use client';

import React, { useEffect } from 'react';

export interface WebMcpParameterSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
}

export interface WebMcpToolDefinition {
  name: string;
  description: string;
  parameters: WebMcpParameterSchema;
  execute?: (params: Record<string, any>) => Promise<any>;
}

export interface WebMcpProviderProps {
  businessName: string;
  tools: WebMcpToolDefinition[];
  endpoint?: string;
  children?: React.ReactNode;
}

/**
 * WebMcpProvider - Outfits the website for browser-native AI Agent interaction (WebMCP).
 * Injects tool definitions onto navigator.modelContext / window.modelContext
 * and advertises the standard /.well-known/mcp.json manifest.
 */
export function WebMcpProvider({
  businessName,
  tools,
  endpoint = '/.well-known/mcp.json',
  children,
}: WebMcpProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const normalizedNamespace = businessName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const win = window as any;
    const nav = navigator as any;
    const existingContext = win.modelContext || nav.modelContext || {};
    
    const formattedTools = tools.map((tool) => ({
      name: `${normalizedNamespace}_${tool.name}`,
      description: tool.description,
      inputSchema: tool.parameters,
      call: async (args: Record<string, any>) => {
        if (tool.execute) {
          return await tool.execute(args);
        }
        try {
          const res = await fetch('/api/agent-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: tool.name,
              arguments: args,
              timestamp: new Date().toISOString(),
            }),
          });
          return await res.json();
        } catch (err: any) {
          return { status: 'error', message: err.message };
        }
      },
    }));

    const updatedContext = {
      ...existingContext,
      version: '1.0.0',
      businessName,
      endpoint,
      tools: [...(existingContext.tools || []), ...formattedTools],
    };

    win.modelContext = updatedContext;
    if ('modelContext' in navigator) {
      nav.modelContext = updatedContext;
    }
  }, [businessName, tools, endpoint]);

  return (
    <>
      <link rel="alternate" type="application/json" title="WebMCP Manifest" href={endpoint} />
      {children}
    </>
  );
}

export default WebMcpProvider;
