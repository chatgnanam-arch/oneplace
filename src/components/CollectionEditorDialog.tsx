import { type FormEvent, useState } from "react";
import type { BookmarkCollectionInput } from "../types/bookmarks";
import { ModalPanel } from "./ModalPanel";

interface CollectionEditorDialogProps {
  onClose: () => void;
  onSubmit: (value: BookmarkCollectionInput) => Promise<void>;
}

export function CollectionEditorDialog({
  onClose,
  onSubmit
}: CollectionEditorDialogProps) {
  const [draft, setDraft] = useState<BookmarkCollectionInput>({
    description: "",
    name: ""
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(draft);
  }

  return (
    <ModalPanel
      description="Categories help keep your links grouped by project, topic, or workflow."
      onClose={onClose}
      title="Create category"
    >
      <form className="editor-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Name</span>
          <input
            required
            placeholder="Work stack"
            type="text"
            value={draft.name}
            onChange={(event) => {
              const nextName = event.currentTarget.value;
              setDraft((current) => ({ ...current, name: nextName }));
            }}
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            placeholder="Optional context for this category"
            rows={3}
            value={draft.description}
            onChange={(event) => {
              const nextDescription = event.currentTarget.value;
              setDraft((current) => ({
                ...current,
                description: nextDescription
              }));
            }}
          />
        </label>
        <div className="editor-form__actions">
          <button className="button button--primary" type="submit">
            Create category
          </button>
          <button className="button button--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </ModalPanel>
  );
}
