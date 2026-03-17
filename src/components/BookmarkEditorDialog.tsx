import { type FormEvent, useId, useState } from "react";
import type { BookmarkCollection } from "../types/bookmarks";
import { ModalPanel } from "./ModalPanel";

export const CREATE_CATEGORY_VALUE = "__create_category__";

export interface BookmarkEditorValue {
  collectionId: string;
  description: string;
  newCollectionDescription: string;
  newCollectionName: string;
  notes: string;
  title: string;
  url: string;
}

interface BookmarkEditorDialogProps {
  collections: BookmarkCollection[];
  description: string;
  initialValue: BookmarkEditorValue;
  onClose: () => void;
  onSubmit: (value: BookmarkEditorValue) => Promise<void>;
  submitLabel: string;
  title: string;
}

export function BookmarkEditorDialog({
  collections,
  description,
  initialValue,
  onClose,
  onSubmit,
  submitLabel,
  title
}: BookmarkEditorDialogProps) {
  const [draft, setDraft] = useState(initialValue);
  const urlInputId = useId();
  const urlHintId = useId();
  const isCreatingCategory = draft.collectionId === CREATE_CATEGORY_VALUE;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(draft);
  }

  return (
    <ModalPanel description={description} onClose={onClose} title={title}>
      <form className="editor-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="editor-form__grid">
          <label className="field">
            <span>Title</span>
            <input
              required
              type="text"
              value={draft.title}
              onChange={(event) => {
                const nextTitle = event.currentTarget.value;
                setDraft((current) => ({
                  ...current,
                  title: nextTitle
                }));
              }}
            />
          </label>
          <label className="field">
            <span>Category</span>
            <select
              value={draft.collectionId}
              onChange={(event) => {
                const nextCollectionId = event.currentTarget.value;
                setDraft((current) => ({
                  ...current,
                  collectionId: nextCollectionId
                }));
              }}
            >
              {collections.length === 0 ? (
                <option value={CREATE_CATEGORY_VALUE}>Create your first category</option>
              ) : (
                <>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                  <option value={CREATE_CATEGORY_VALUE}>Create new category</option>
                </>
              )}
            </select>
          </label>
        </div>
        {isCreatingCategory ? (
          <div className="editor-form__grid">
            <label className="field">
              <span>New category name</span>
              <input
                required={isCreatingCategory}
                placeholder="Research"
                type="text"
                value={draft.newCollectionName}
                onChange={(event) => {
                  const nextName = event.currentTarget.value;
                  setDraft((current) => ({
                    ...current,
                    newCollectionName: nextName
                  }));
                }}
              />
            </label>
            <label className="field">
              <span>New category description</span>
              <input
                placeholder="Optional context for this category"
                type="text"
                value={draft.newCollectionDescription}
                onChange={(event) => {
                  const nextDescription = event.currentTarget.value;
                  setDraft((current) => ({
                    ...current,
                    newCollectionDescription: nextDescription
                  }));
                }}
              />
            </label>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor={urlInputId}>
            <span>URL</span>
          </label>
          <input
            aria-describedby={urlHintId}
            id={urlInputId}
            required
            inputMode="url"
            placeholder="openai.com or https://openai.com"
            type="text"
            value={draft.url}
            onChange={(event) => {
              const nextUrl = event.currentTarget.value;
              setDraft((current) => ({
                ...current,
                url: nextUrl
              }));
            }}
          />
          <small className="field__hint" id={urlHintId}>
            You can paste a full URL or just a domain. OnePlace will normalize it
            when saving.
          </small>
        </div>
        <label className="field">
          <span>Description</span>
          <textarea
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
        <label className="field">
          <span>Private note</span>
          <textarea
            placeholder="Only you can see this note after you sign in."
            rows={4}
            value={draft.notes}
            onChange={(event) => {
              const nextNotes = event.currentTarget.value;
              setDraft((current) => ({
                ...current,
                notes: nextNotes
              }));
            }}
          />
        </label>
        <div className="editor-form__actions">
          <button className="button button--primary" type="submit">
            {submitLabel}
          </button>
          <button className="button button--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </ModalPanel>
  );
}
