import { Tool, Prompt } from "@modelcontextprotocol/sdk/types.js";
import { ToolArguments } from "../constants.js";
import { ZodTypeAny } from "zod";
/**
 * MCP Tool Annotations
 * @see https://spec.modelcontextprotocol.io/specification/server/tools/#annotations
 */
export interface ToolAnnotations {
    /** If true, the tool does not modify any external state */
    readOnlyHint?: boolean;
    /** If true, the tool may perform destructive updates (e.g., deleting data) */
    destructiveHint?: boolean;
    /** If true, calling the tool with the same inputs may yield different results */
    idempotentHint?: boolean;
    /** If true, the tool interacts with external entities (APIs, internet, etc.) */
    openWorldHint?: boolean;
}
export interface UnifiedTool {
    name: string;
    description: string;
    zodSchema: ZodTypeAny;
    outputSchema?: ZodTypeAny;
    /** MCP tool annotations for client behavior hints */
    annotations?: ToolAnnotations;
    prompt?: {
        description: string;
        arguments?: Array<{
            name: string;
            description: string;
            required: boolean;
        }>;
    };
    execute: (args: ToolArguments, onProgress?: (newOutput: string) => void) => Promise<string>;
    category?: 'simple' | 'ai' | 'utility';
}
export declare const toolRegistry: UnifiedTool[];
export declare function toolExists(toolName: string): boolean;
export declare function getToolDefinitions(): Tool[];
export declare function getPromptDefinitions(): Prompt[];
export declare function executeTool(toolName: string, args: ToolArguments, onProgress?: (newOutput: string) => void): Promise<string>;
export declare function getPromptMessage(toolName: string, args: Record<string, any>): string;
//# sourceMappingURL=registry.d.ts.map