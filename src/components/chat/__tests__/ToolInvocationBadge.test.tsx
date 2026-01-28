import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

function createToolInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "result"
): ToolInvocation {
  if (state === "result") {
    return {
      toolCallId: "test-id",
      toolName,
      args,
      state: "result",
      result: "Success",
    };
  }
  return {
    toolCallId: "test-id",
    toolName,
    args,
    state: "call",
  };
}

test('renders "Creating" message for str_replace_editor with create command', () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/src/components/Button.tsx",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating `Button.tsx`")).toBeDefined();
});

test('renders "Editing" message for str_replace_editor with str_replace command', () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "str_replace",
    path: "/src/App.jsx",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing `App.jsx`")).toBeDefined();
});

test('renders "Inserting" message for str_replace_editor with insert command', () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "insert",
    path: "/src/utils/helpers.ts",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Inserting into `helpers.ts`")).toBeDefined();
});

test('renders "Viewing" message for str_replace_editor with view command', () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "view",
    path: "/src/index.tsx",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Viewing `index.tsx`")).toBeDefined();
});

test('renders "Renaming" message for file_manager with rename command', () => {
  const toolInvocation = createToolInvocation("file_manager", {
    command: "rename",
    old_path: "/src/OldName.tsx",
    new_path: "/src/NewName.tsx",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming `OldName.tsx`")).toBeDefined();
});

test('renders "Deleting" message for file_manager with delete command', () => {
  const toolInvocation = createToolInvocation("file_manager", {
    command: "delete",
    path: "/src/unused/Component.tsx",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Deleting `Component.tsx`")).toBeDefined();
});

test("shows spinner when state is not result", () => {
  const toolInvocation = createToolInvocation(
    "str_replace_editor",
    {
      command: "create",
      path: "/src/NewFile.tsx",
    },
    "call"
  );

  const { container } = render(
    <ToolInvocationBadge toolInvocation={toolInvocation} />
  );

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
  expect(spinner).not.toBeNull();
});

test("shows green dot when state is result", () => {
  const toolInvocation = createToolInvocation(
    "str_replace_editor",
    {
      command: "create",
      path: "/src/NewFile.tsx",
    },
    "result"
  );

  const { container } = render(
    <ToolInvocationBadge toolInvocation={toolInvocation} />
  );

  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
  expect(greenDot).not.toBeNull();
});

test("extracts filename from full path correctly", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/very/deep/nested/path/to/MyComponent.tsx",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating `MyComponent.tsx`")).toBeDefined();
});

test("falls back to tool name for unknown tools", () => {
  const toolInvocation = createToolInvocation("unknown_tool", {
    some_arg: "value",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("handles missing path gracefully", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
  });

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating `file`")).toBeDefined();
});

test("handles missing args gracefully", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "test-id",
    toolName: "str_replace_editor",
    args: undefined as unknown as Record<string, unknown>,
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
