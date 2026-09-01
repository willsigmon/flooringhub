"use client";

import { WebMcpProvider } from "@/components/WebMcpProvider";
import { FLOORING_HUB_WEBMCP_TOOLS } from "@/lib/webmcp";

/** Client boundary so tool `execute` fns are never passed from a Server Component. */
export default function FlooringHubWebMcp() {
  return <WebMcpProvider businessName="Flooring Hub" tools={FLOORING_HUB_WEBMCP_TOOLS} />;
}
