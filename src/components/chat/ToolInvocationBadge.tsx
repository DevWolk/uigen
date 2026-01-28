import { Loader2, FilePlus, FileEdit, FileSearch, Trash2, ArrowRightLeft, FileInput } from "lucide-react";
interface ToolInvocationBadgeProps {
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: string;
    result?: unknown;
  };
}

interface ToolArgs {
  command?: string;
  path?: string;
  old_path?: string;
  new_path?: string;
}

function extractFilename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

function getToolDisplay(toolName: string, args: ToolArgs): { icon: React.ReactNode; message: string } {
  const iconClass = "w-3 h-3";

  if (toolName === "str_replace_editor") {
    const filename = args.path ? extractFilename(args.path) : "file";
    switch (args.command) {
      case "create":
        return {
          icon: <FilePlus className={iconClass} />,
          message: `Creating \`${filename}\``,
        };
      case "str_replace":
        return {
          icon: <FileEdit className={iconClass} />,
          message: `Editing \`${filename}\``,
        };
      case "insert":
        return {
          icon: <FileInput className={iconClass} />,
          message: `Inserting into \`${filename}\``,
        };
      case "view":
        return {
          icon: <FileSearch className={iconClass} />,
          message: `Viewing \`${filename}\``,
        };
      default:
        return {
          icon: <FileEdit className={iconClass} />,
          message: `${toolName}`,
        };
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const oldFilename = args.old_path ? extractFilename(args.old_path) : "file";
        return {
          icon: <ArrowRightLeft className={iconClass} />,
          message: `Renaming \`${oldFilename}\``,
        };
      }
      case "delete": {
        const filename = args.path ? extractFilename(args.path) : "file";
        return {
          icon: <Trash2 className={iconClass} />,
          message: `Deleting \`${filename}\``,
        };
      }
      default:
        return {
          icon: <FileEdit className={iconClass} />,
          message: `${toolName}`,
        };
    }
  }

  return {
    icon: <FileEdit className={iconClass} />,
    message: toolName,
  };
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const args = (toolInvocation.args || {}) as ToolArgs;
  const { icon, message } = getToolDisplay(toolInvocation.toolName, args);
  const isComplete = toolInvocation.state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-600">{icon}</span>
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}
