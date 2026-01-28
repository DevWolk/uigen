import { render, screen, fireEvent } from "@testing-library/react";
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
    <div>{children}</div>
  ),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("MainContent Toggle Buttons", () => {
  it("should start with preview view by default", () => {
    render(<MainContent />);

    const previewContainer = screen.getByTestId("preview-frame").parentElement;
    const codeContainer = screen.getByTestId("file-tree").parentElement?.parentElement?.parentElement;

    expect(previewContainer).not.toHaveClass("hidden");
    expect(codeContainer).toHaveClass("hidden");
  });

  it("should toggle to code view when Code button is clicked", () => {
    render(<MainContent />);

    const codeButton = screen.getByRole("tab", { name: /code/i });
    fireEvent.click(codeButton);

    const previewContainer = screen.getByTestId("preview-frame").parentElement;
    const codeContainer = screen.getByTestId("file-tree").parentElement?.parentElement?.parentElement;

    expect(previewContainer).toHaveClass("hidden");
    expect(codeContainer).not.toHaveClass("hidden");
  });

  it("should toggle back to preview when Preview button is clicked", () => {
    render(<MainContent />);

    const codeButton = screen.getByRole("tab", { name: /code/i });
    const previewButton = screen.getByRole("tab", { name: /preview/i });

    // Switch to code view
    fireEvent.click(codeButton);

    // Switch back to preview
    fireEvent.click(previewButton);

    const previewContainer = screen.getByTestId("preview-frame").parentElement;
    const codeContainer = screen.getByTestId("file-tree").parentElement?.parentElement?.parentElement;

    expect(previewContainer).not.toHaveClass("hidden");
    expect(codeContainer).toHaveClass("hidden");
  });

  it("should toggle multiple times correctly", () => {
    render(<MainContent />);

    const codeButton = screen.getByRole("tab", { name: /code/i });
    const previewButton = screen.getByRole("tab", { name: /preview/i });

    const getContainers = () => {
      const previewContainer = screen.getByTestId("preview-frame").parentElement;
      const codeContainer = screen.getByTestId("file-tree").parentElement?.parentElement?.parentElement;
      return { previewContainer, codeContainer };
    };

    // Click code
    fireEvent.click(codeButton);
    let { previewContainer, codeContainer } = getContainers();
    expect(previewContainer).toHaveClass("hidden");
    expect(codeContainer).not.toHaveClass("hidden");

    // Click preview
    fireEvent.click(previewButton);
    ({ previewContainer, codeContainer } = getContainers());
    expect(previewContainer).not.toHaveClass("hidden");
    expect(codeContainer).toHaveClass("hidden");

    // Click code again
    fireEvent.click(codeButton);
    ({ previewContainer, codeContainer } = getContainers());
    expect(previewContainer).toHaveClass("hidden");
    expect(codeContainer).not.toHaveClass("hidden");

    // Click preview again
    fireEvent.click(previewButton);
    ({ previewContainer, codeContainer } = getContainers());
    expect(previewContainer).not.toHaveClass("hidden");
    expect(codeContainer).toHaveClass("hidden");
  });

  it("should keep both views mounted in DOM at all times", () => {
    render(<MainContent />);

    // Both views should be in DOM regardless of active view
    expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
    expect(screen.getByTestId("file-tree")).toBeInTheDocument();
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();

    // Toggle to code view
    const codeButton = screen.getByRole("tab", { name: /code/i });
    fireEvent.click(codeButton);

    // Both views should still be in DOM
    expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
    expect(screen.getByTestId("file-tree")).toBeInTheDocument();
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();
  });
});
