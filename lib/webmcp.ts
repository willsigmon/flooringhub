import {
  SITE_CONFIG,
  SITE_FACTS,
  SITE_PATHS,
  SITE_URL,
} from "@/lib/site-config";

export type JsonSchemaType = "string" | "number" | "boolean" | "object" | "array" | "null";

export interface WebMcpPropertySchema {
  type: JsonSchemaType;
  enum?: string[];
  description?: string;
}

export interface WebMcpParameterSchema {
  type: JsonSchemaType;
  properties?: Record<string, WebMcpPropertySchema>;
  required?: string[];
}

export interface WebMcpToolResult {
  status: "ok" | "error";
  message?: string;
  data?: Record<string, unknown>;
}

export interface WebMcpToolDefinition {
  name: string;
  description: string;
  parameters: WebMcpParameterSchema;
  execute: (params: Record<string, unknown>) => Promise<WebMcpToolResult>;
}

export interface WebMcpRegisteredTool {
  name: string;
  description: string;
  inputSchema: WebMcpParameterSchema;
  call: (args: Record<string, unknown>) => Promise<WebMcpToolResult>;
}

export interface WebMcpModelContext {
  version: string;
  businessName: string;
  endpoint: string;
  tools: WebMcpRegisteredTool[];
}

export type FlooringServiceSlug = "hardwood" | "lvp" | "laminate" | "carpet" | "other";

function isFlooringServiceSlug(value: unknown): value is FlooringServiceSlug {
  return (
    value === "hardwood" ||
    value === "lvp" ||
    value === "laminate" ||
    value === "carpet" ||
    value === "other"
  );
}

async function getServiceInfo(): Promise<WebMcpToolResult> {
  return {
    status: "ok",
    data: {
      name: SITE_CONFIG.companyName,
      website: SITE_URL,
      owner: SITE_FACTS.owner,
      locality: SITE_FACTS.locality,
      region: SITE_FACTS.region,
      cities: [...SITE_FACTS.cities],
      services: [...SITE_FACTS.services],
      hours: SITE_CONFIG.hours,
      phone: SITE_CONFIG.phoneDisplay,
      phoneTel: SITE_CONFIG.phone,
      email: SITE_CONFIG.email,
      established: SITE_FACTS.established,
      years: SITE_FACTS.years,
      homes: SITE_FACTS.homes,
      googleRating: SITE_FACTS.googleRating,
      reviewCount: SITE_FACTS.reviewCount,
      quoteUrl: `${SITE_URL}${SITE_PATHS.quote}`,
      note: "Estimates are free and given in person. No published per-square-foot pricing.",
    },
  };
}

async function requestEstimate(params: Record<string, unknown>): Promise<WebMcpToolResult> {
  const service = isFlooringServiceSlug(params.service) ? params.service : undefined;

  return {
    status: "ok",
    message:
      "Flooring Hub does not calculate or publish online prices. Request a free in-home estimate.",
    data: {
      quoteUrl: `${SITE_URL}${SITE_PATHS.quote}`,
      phone: SITE_CONFIG.phoneDisplay,
      phoneTel: SITE_CONFIG.phone,
      email: SITE_CONFIG.email,
      hours: SITE_CONFIG.hours,
      service,
    },
  };
}

export const FLOORING_HUB_WEBMCP_TOOLS: WebMcpToolDefinition[] = [
  {
    name: "get_service_info",
    description:
      "Return Flooring Hub contact details, service area, hours, and services. Does not include pricing.",
    parameters: {
      type: "object",
      properties: {},
    },
    execute: getServiceInfo,
  },
  {
    name: "request_estimate",
    description:
      "Explain how a homeowner can request a free in-home estimate. Does not calculate prices.",
    parameters: {
      type: "object",
      properties: {
        service: {
          type: "string",
          enum: ["hardwood", "lvp", "laminate", "carpet", "other"],
          description: "Optional service the homeowner is asking about.",
        },
      },
    },
    execute: requestEstimate,
  },
];
