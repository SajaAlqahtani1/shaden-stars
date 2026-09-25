import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  StarIcon,
  LinkIcon,
  DotsVerticalIcon,
  EditIcon,
  TrashIcon,
  GirlAvatarIcon,
  BoyAvatarIcon,
} from "./icons.jsx";
import { formatStarsCount } from "../utils/pluralStars.js";

function ChildCard({ child, onDelete }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBoy = child.gender === "boy";
  const Avatar = isBoy ? BoyAvatarIcon : GirlAvatarIcon;

  async function handleCopyLink() {
    const link = `${window.location.origin}/view/${child.id}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleEdit() {
    setMenuOpen(false);
    navigate(`/children/${child.id}/edit`);
  }

  function handleDelete() {
    setMenuOpen(false);
    const confirmed = window.confirm(`هل تريد حذف ${child.name}؟`);
    if (confirmed) {
      onDelete(child.id);
    }
  }

  return (
    <div className="child-card" data-theme={isBoy ? "boy" : undefined}>
      <div className="child-card-top">
        <Avatar className="child-avatar" />

        <div className="child-info">
          <h3 className="child-name">{child.name}</h3>
          <div className="child-stars">
            <StarIcon />
            <span>{formatStarsCount(child.totalStars || 0)}</span>
          </div>
        </div>

        <button
          type="button"
          className="child-menu-trigger"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="خيارات"
        >
          <DotsVerticalIcon />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              className="child-menu-backdrop"
              onClick={() => setMenuOpen(false)}
              aria-label="إغلاق القائمة"
            />
            <div className="child-menu">
              <button type="button" className="child-menu-item" onClick={handleEdit}>
                <EditIcon />
                تعديل
              </button>
              <button type="button" className="child-menu-item danger" onClick={handleDelete}>
                <TrashIcon />
                حذف
              </button>
            </div>
          </>
        )}
      </div>

      <button type="button" className="child-link-button" onClick={handleCopyLink}>
        <LinkIcon />
        {copied ? "تم النسخ" : "رابط الآيباد"}
      </button>
    </div>
  );
}

export default ChildCard;
