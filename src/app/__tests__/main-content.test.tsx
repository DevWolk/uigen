import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MainContent } from "../main-content";

// Mock the components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header</div>,
}));

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock resizable components to simplify DOM structure
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-panel-group">{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-panel">{children}</div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

describe("MainContent Toggle Buttons", () => {
  // Get the first MainContent instance and scope all queries to it
  const getMainContent = () => {
    return within(screen.getAllByTestId("main-content")[0]);
  };

  it("should start with preview view by default", () => {
    render(<MainContent />);
    const container = getMainContent();

    const previewContainer = container.getByTestId("preview-view-container");
    const codeContainer = container.getByTestId("code-view-container");

    expect(previewContainer).not.toHaveClass("hidden");
    expect(codeContainer).toHaveClass("hidden");
  });

  it("should toggle to code view when Code button is clicked", async () => {
    const user = userEvent.setup();
    render(<MainContent />);
    const container = getMainContent();

    const codeButton = container.getByRole("tab", { name: /code/i });
    await user.click(codeButton);

    const previewContainer = container.getByTestId("preview-view-container");
    const codeContainer = container.getByTestId("code-view-container");

    expect(previewContainer).toHaveClass("hidden");
    expect(codeContainer).not.toHaveClass("hidden");
  });

  it("should toggle back to preview when Preview button is clicked", async () => {
    const user = userEvent.setup();
    render(<MainContent />);
    const container = getMainContent();

    const codeButton = container.getByRole("tab", { name: /code/i });
    const previewButton = container.getByRole("tab", { name: /preview/i });

    // Switch to code view
    await user.click(codeButton);

    // Switch back to preview
    await user.click(previewButton);

    const previewContainer = container.getByTestId("preview-view-container");
    const codeContainer = container.getByTestId("code-view-container");

    expect(previewContainer).not.toHaveClass("hidden");
    expect(codeContainer).toHaveClass("hidden");
  });

  it("should toggle multiple times correctly", async () => {
    const user = userEvent.setup();
    render(<MainContent />);
    const container = getMainContent();

    const codeButton = container.getByRole("tab", { name: /code/i });
    const previewButton = container.getByRole("tab", { name: /preview/i });

    const getContainers = () => ({
      previewContainer: container.getByTestId("preview-view-container"),
      codeContainer: container.getByTestId("code-view-container"),
    });

    // Click code
    await user.click(codeButton);
    let { previewContainer, codeContainer } = getContainers();
    expect(previewContainer).toHaveClass("hidden");
    expect(codeContainer).not.toHaveClass("hidden");

    // Click preview
    await user.click(previewButton);
    ({ previewContainer, codeContainer } = getContainers());
    expect(previewContainer).not.toHaveClass("hidden");
    expect(codeContainer).toHaveClass("hidden");

    // Click code again
    await user.click(codeButton);
    ({ previewContainer, codeContainer } = getContainers());
    expect(previewContainer).toHaveClass("hidden");
    expect(codeContainer).not.toHaveClass("hidden");

    // Click preview again
    await user.click(previewButton);
    ({ previewContainer, codeContainer } = getContainers());
    expect(previewContainer).not.toHaveClass("hidden");
    expect(codeContainer).toHaveClass("hidden");
  });

  it("should keep both views mounted in DOM at all times", async () => {
    const user = userEvent.setup();
    render(<MainContent />);
    const container = getMainContent();

    // Both views should be in DOM regardless of active view
    expect(container.getByTestId("preview-frame")).toBeInTheDocument();
    expect(container.getByTestId("file-tree")).toBeInTheDocument();
    expect(container.getByTestId("code-editor")).toBeInTheDocument();

    // Toggle to code view
    const codeButton = container.getByRole("tab", { name: /code/i });
    await user.click(codeButton);

    // Both views should still be in DOM
    expect(container.getByTestId("preview-frame")).toBeInTheDocument();
    expect(container.getByTestId("file-tree")).toBeInTheDocument();
    expect(container.getByTestId("code-editor")).toBeInTheDocument();
  });
});
