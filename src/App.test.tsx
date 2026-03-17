import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  BookmarkEditorDialog,
  CREATE_CATEGORY_VALUE
} from "./components/BookmarkEditorDialog";
import { CollectionEditorDialog } from "./components/CollectionEditorDialog";
import { LinkTile } from "./components/LinkTile";
import catalog from "./data/catalog";

function renderAt(pathname = "/") {
  window.history.pushState({}, "", pathname);
  return render(<App />);
}

describe("OnePlace app", () => {
  it("renders the public discovery experience", () => {
    renderAt("/");

    expect(screen.getByRole("link", { name: /Discover/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /OTT/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Choose a category tile to reveal its links/i
      })
    ).toBeInTheDocument();
  });

  it("keeps 20 links in every starter category", () => {
    for (const category of catalog.categories) {
      const count = catalog.links.filter((link) => link.categoryId === category.id).length;
      expect(count).toBe(20);
    }
  });

  it("shows password auth and local setup guidance on the private route", () => {
    renderAt("/my-links");

    const authPanel = screen.getByRole("heading", {
      name: /Your links, synced to your account/i
    }).closest("section");

    expect(authPanel).not.toBeNull();

    const panel = within(authPanel!);
    expect(panel.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(panel.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(panel.getByText(/VITE_SUPABASE_URL/i)).toBeInTheDocument();
    expect(panel.getByText(/VITE_SUPABASE_ANON_KEY/i)).toBeInTheDocument();
    expect(panel.queryByText(/Start demo workspace/i)).not.toBeInTheDocument();
  });

  it("switches the auth panel into create-account mode", () => {
    renderAt("/my-links");

    const authPanel = screen.getByRole("heading", {
      name: /Your links, synced to your account/i
    }).closest("section");

    expect(authPanel).not.toBeNull();

    fireEvent.click(within(authPanel!).getByRole("tab", { name: /Create account/i }));

    expect(within(authPanel!).getByLabelText(/Confirm password/i)).toBeInTheDocument();
    expect(
      within(authPanel!).getByRole("button", { name: /^Create account$/i })
    ).toBeDisabled();
  });

  it("keeps the bookmark dialog focused on core fields", () => {
    render(
      <BookmarkEditorDialog
        collections={[
          {
            color: "#1f8a70",
            createdAt: "",
            description: "",
            icon: "bookmark",
            id: "collection-1",
            name: "Saved links",
            sortOrder: 0,
            updatedAt: "",
            userId: "user-1"
          }
        ]}
        description="Add a site."
        initialValue={{
          collectionId: "collection-1",
          description: "",
          newCollectionDescription: "",
          newCollectionName: "",
          notes: "",
          title: "",
          url: ""
        }}
        submitLabel="Save bookmark"
        title="Add bookmark"
        onClose={vi.fn()}
        onSubmit={vi.fn(async () => {})}
      />
    );

    const dialog = screen.getByRole("dialog", { name: /Add bookmark/i });
    const dialogQueries = within(dialog);

    expect(dialogQueries.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(dialogQueries.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(dialogQueries.getByLabelText(/^URL$/i)).toBeInTheDocument();
    expect(dialogQueries.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(dialogQueries.getByLabelText(/Private note/i)).toBeInTheDocument();
    expect(dialogQueries.queryByLabelText(/Tags/i)).not.toBeInTheDocument();
    expect(
      dialogQueries.queryByRole("checkbox", { name: /Mark as favorite/i })
    ).not.toBeInTheDocument();
  });

  it("lets the bookmark dialog switch into new category creation", () => {
    render(
      <BookmarkEditorDialog
        collections={[
          {
            color: "#1f8a70",
            createdAt: "",
            description: "",
            icon: "bookmark",
            id: "collection-1",
            name: "Saved links",
            sortOrder: 0,
            updatedAt: "",
            userId: "user-1"
          }
        ]}
        description="Add a site."
        initialValue={{
          collectionId: "collection-1",
          description: "",
          newCollectionDescription: "",
          newCollectionName: "",
          notes: "",
          title: "",
          url: ""
        }}
        submitLabel="Save bookmark"
        title="Add bookmark"
        onClose={vi.fn()}
        onSubmit={vi.fn(async () => {})}
      />
    );

    const dialog = screen.getByRole("dialog", { name: /Add bookmark/i });
    const dialogQueries = within(dialog);
    fireEvent.change(dialogQueries.getByLabelText(/Category/i), {
      target: { value: CREATE_CATEGORY_VALUE }
    });

    expect(dialogQueries.getByLabelText(/New category name/i)).toBeInTheDocument();
    expect(
      dialogQueries.getByLabelText(/New category description/i)
    ).toBeInTheDocument();
  });

  it("renders website icons on link tiles", () => {
    const { container } = render(
      <LinkTile
        accentColor="#ff7a59"
        link={{
          categoryId: "tools",
          description: "AI chat and coding help.",
          iconKey: "toolbox",
          id: "chatgpt",
          name: "ChatGPT",
          tags: ["ai", "assistant"],
          url: "https://chatgpt.com/"
        }}
      />
    );

    expect(container.querySelector("img.link-tile__icon")).not.toBeNull();
  });

  it("keeps category creation to name and description only", () => {
    render(
      <CollectionEditorDialog
        onClose={vi.fn()}
        onSubmit={vi.fn(async () => {})}
      />
    );

    const dialog = screen.getByRole("dialog", { name: /Create category/i });
    const dialogQueries = within(dialog);

    expect(dialogQueries.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(dialogQueries.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(dialogQueries.queryByLabelText(/Icon/i)).not.toBeInTheDocument();
    expect(dialogQueries.queryByLabelText(/Color/i)).not.toBeInTheDocument();
  });
});
