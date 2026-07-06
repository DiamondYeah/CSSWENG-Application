import React, { useMemo, useState } from "react";
import { Plus, Check, Trash2, Pencil, X } from "lucide-react";
import "./Category.css";

import SchedulingTabs from "../components/SchedulingTabs"; // NEW: replaces hardcoded tab divs

// ---------------------------------------------------------------
// types
// ---------------------------------------------------------------

export type Platform = "facebook" | "linkedin" | "instagram" | "tiktok";

export interface ConnectedAccount {
  id: string;
  name: string;
  platform: Platform;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string; // hex
  accountIds: string[];
}

export interface CategoryPageProps {
  accounts?: ConnectedAccount[];
  categories?: Category[];
  onCreateCategory?: () => void;
  onSaveCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

// ---------------------------------------------------------------
// palette — matches the ap-blue / ap-pink tokens already used
// across Calendar.css, extended with a small curated set
// ---------------------------------------------------------------

const COLOR_OPTIONS = [
  "#2563eb", // ap-blue
  "#a8124a", // ap-pink
  "#059669", // emerald
  "#d97706", // amber
  "#7c3aed", // violet
];

const PLATFORM_META: Record<Platform, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877F2" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  instagram: { label: "Instagram", color: "#E1306C" },
  tiktok: { label: "TikTok", color: "#000000" },
};

// ---------------------------------------------------------------
// default demo data (used only if no props supplied)
// ---------------------------------------------------------------

const DEFAULT_ACCOUNTS: ConnectedAccount[] = [
  { id: "acc-1", name: "AgilaPost Official", platform: "instagram" },
  { id: "acc-2", name: "AgilaPost Biz", platform: "linkedin" },
  { id: "acc-3", name: "Creator Hub", platform: "tiktok" },
  { id: "acc-4", name: "Community Page", platform: "facebook" },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Product Launches", color: "#d97706", accountIds: ["acc-1", "acc-2"] },
  { id: "cat-2", name: "Behind the Scenes", color: "#059669", accountIds: ["acc-3"] },
  { id: "cat-3", name: "Client Work", color: "#a8124a", accountIds: ["acc-1", "acc-3", "acc-4"] },
];

// ---------------------------------------------------------------
// account chip
// ---------------------------------------------------------------

function AccountChip({
  account,
  selected,
  onToggle,
}: {
  account: ConnectedAccount;
  selected: boolean;
  onToggle: () => void;
}) {
  const meta = PLATFORM_META[account.platform];
  return (
    <button
      type="button"
      className={`cat-chip ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
    >
      <span className="cat-chip__avatar" style={{ background: meta.color }}>
        {account.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="cat-chip__name">{account.name}</span>
      <span className={`cat-chip__check ${selected ? "is-selected" : ""}`}>
        {selected && <Check size={11} color="#fff" />}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------
// category card (grid tile + inline expand editor)
// ---------------------------------------------------------------

function CategoryCard({
  category,
  accounts,
  isOpen,
  onToggleOpen,
  onSave,
  onDelete,
}: {
  category: Category;
  accounts: ConnectedAccount[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onSave: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [draftName, setDraftName] = useState(category.name);
  const [draftColor, setDraftColor] = useState(category.color);
  const [draftAccountIds, setDraftAccountIds] = useState<string[]>(category.accountIds);

  const linkedAccounts = useMemo(
    () => accounts.filter((a) => category.accountIds.includes(a.id)),
    [accounts, category.accountIds]
  );

  const toggleAccount = (id: string) =>
    setDraftAccountIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );

  const handleSave = () => {
    onSave({ ...category, name: draftName, color: draftColor, accountIds: draftAccountIds });
    onToggleOpen();
  };

  return (
    <div className={`cat-card ${isOpen ? "is-open" : ""}`}>
      <button type="button" className="cat-card__summary" onClick={onToggleOpen}>
        <span className="cat-card__dot" style={{ background: category.color }} />
        <span className="cat-card__name">{category.name}</span>
        <span className="cat-card__count">
          {linkedAccounts.length} {linkedAccounts.length === 1 ? "account" : "accounts"}
        </span>
        <span className="cat-card__avatars">
          {linkedAccounts.slice(0, 4).map((a) => {
            const meta = PLATFORM_META[a.platform];
            return (
              <span
                key={a.id}
                className="cat-card__avatar"
                style={{ background: meta.color }}
                title={a.name}
              >
                {a.name.slice(0, 1).toUpperCase()}
              </span>
            );
          })}
          {linkedAccounts.length > 4 && (
            <span className="cat-card__avatar cat-card__avatar--overflow">
              +{linkedAccounts.length - 4}
            </span>
          )}
        </span>
        <Pencil size={14} className="cat-card__edit-icon" />
      </button>

      {isOpen && (
        <div className="cat-card__editor">
          <div className="cat-field">
            <label className="cat-field__label">Category name</label>
            <input
              className="cat-field__input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Product Launches"
            />
          </div>

          <div className="cat-field">
            <label className="cat-field__label">Color</label>
            <div className="cat-swatches">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`cat-swatch ${draftColor === c ? "is-selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setDraftColor(c)}
                  aria-label={`Choose color ${c}`}
                >
                  {draftColor === c && <Check size={13} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          <div className="cat-field">
            <label className="cat-field__label">Accounts in this category</label>
            <div className="cat-chip-list">
              {accounts.map((a) => (
                <AccountChip
                  key={a.id}
                  account={a}
                  selected={draftAccountIds.includes(a.id)}
                  onToggle={() => toggleAccount(a.id)}
                />
              ))}
            </div>
          </div>

          <div className="cat-card__actions">
            <button type="button" className="cat-btn cat-btn--primary" onClick={handleSave}>
              Save changes
            </button>
            <button
              type="button"
              className="cat-btn cat-btn--danger"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button type="button" className="cat-btn cat-btn--ghost" onClick={onToggleOpen}>
              <X size={14} />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// main page
// ---------------------------------------------------------------

export default function CategoryPage({
  accounts = DEFAULT_ACCOUNTS,
  categories: initialCategories = DEFAULT_CATEGORIES,
  onCreateCategory,
  onSaveCategory,
  onDeleteCategory,
}: CategoryPageProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggleOpen = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const handleSave = (updated: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    onSaveCategory?.(updated);
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setOpenId((prev) => (prev === id ? null : prev));
    onDeleteCategory?.(id);
  };

  const handleCreate = () => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: "New Category",
      color: COLOR_OPTIONS[categories.length % COLOR_OPTIONS.length],
      accountIds: [],
    };
    setCategories((prev) => [...prev, newCategory]);
    setOpenId(newCategory.id);
    onCreateCategory?.();
  };

  return (
    <div>
      <SchedulingTabs/>
      <main className="main-content">
        <div className="cat-page">
          <div className="cat-page__header">
        
            <button type="button" className="cat-btn cat-btn--primary cat-btn--new" onClick={handleCreate}>
              <Plus size={15} />
              New Category
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="cat-empty">
              <p className="cat-empty__title">No categories yet</p>
              <p className="cat-empty__text">
                Create one to start grouping accounts for faster scheduling.
              </p>
              <button type="button" className="cat-btn cat-btn--primary" onClick={handleCreate}>
                <Plus size={15} />
                New Category
              </button>
            </div>
          ) : (
            <div className="cat-grid">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  accounts={accounts}
                  isOpen={openId === cat.id}
                  onToggleOpen={() => handleToggleOpen(cat.id)}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}