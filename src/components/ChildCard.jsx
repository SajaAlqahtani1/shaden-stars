import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StarIcon, LinkIcon, DotsVerticalIcon, EditIcon, TrashIcon } from "./icons.jsx";
import { Avatar } from "./avatars.jsx";
import { formatStarsCount } from "../utils/pluralStars.js";

function ChildCard({ child, onDelete }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBoy = child.gender === "boy";

  async function handleCopyLink(event) {
    event.stopPropagation();
    const link = `${window.location.origin}/view/${child.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Copying can be blocked by the browser; show the link so it can be copied by hand.
      window.prompt("انسخ رابط الآيباد", link);
    }
  }

  function handleOpenDashboard() {
    navigate(`/children/${child.id}`);
  }

  function handleToggleMenu(event) {
    event.stopPropagation();
    setMenuOpen((previous) => !previous);
  }

  function handleCloseMenu(event) {
    event.stopPropagation();
    setMenuOpen(false);
  }

  function handleEdit(event) {
    event.stopPropagation();
    setMenuOpen(false);
    navigate(`/children/${child.id}/edit`);
  }

  function handleDelete(event) {
    event.stopPropagation();
    setMenuOpen(false);
    const confirmed = window.confirm(`هل تريد حذف ${child.name}؟`);
    if (confirmed) {
      onDelete(child.id);
    }
  }

  return (
    <div
      className="child-card"
      data-theme={isBoy ? "boy" : undefined}
      role="button"
      tabIndex={0}
      onClick={handleOpenDashboard}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          handleOpenDashboard();
        }
      }}
    >
      <div className="child-card-top">
        <Avatar avatar={child.avatar} gender={child.gender} className="child-avatar" />

        <div className="child-info">
          <h3 className="child-name">{child.name}</h3>
          <div className="child-stars">
            <StarIcon />
            <span>{formatStarsCount(child.totalStars || 0)}</span>
          </div>
        </div>

        <div className="child-menu-wrap">
          <button
            type="button"
            className="child-menu-trigger"
            onClick={handleToggleMenu}
            aria-label="خيارات"
          >
            <DotsVerticalIcon />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="child-menu-backdrop"
                onClick={handleCloseMenu}
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
      </div>

      <button type="button" className="child-link-button" onClick={handleCopyLink}>
        <LinkIcon />
        {copied ? "تم النسخ" : "رابط الآيباد"}
      </button>
    </div>
  );
}

export default ChildCard;
