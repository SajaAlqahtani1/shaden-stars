import { useState } from "react";
import { CloseIcon } from "./icons.jsx";
import { REWARD_SUGGESTIONS } from "../utils/rewardSuggestions.js";

const STARS_STEP = 5;
const MIN_STARS = 5;
const MAX_STARS = 100;
const DEFAULT_STARS = 10;
const NAME_MAX_LENGTH = 40;

// Mounted only while open, so each opening starts with fresh state.
function RewardSheet({ initialReward, existingNames, onClose, onSubmit }) {
  const [name, setName] = useState(initialReward ? initialReward.name : "");
  const [stars, setStars] = useState(initialReward ? initialReward.starsNeeded : DEFAULT_STARS);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initialReward);
  const visibleSuggestions = REWARD_SUGGESTIONS.filter((suggestion) => !existingNames.includes(suggestion.name));

  function handleSelectSuggestion(suggestion) {
    setName(suggestion.name);
    setStars(suggestion.stars);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("الرجاء إدخال اسم المكافأة");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ name: trimmedName, starsNeeded: stars });
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
      setSaving(false);
    }
  }

  return (
    <div className="task-sheet-overlay" onClick={onClose}>
      <div className="task-sheet-panel" onClick={(event) => event.stopPropagation()}>
        <div className="task-sheet-handle" />

        <div className="task-sheet-header">
          <h2 className="task-sheet-title">{isEdit ? "تعديل المكافأة" : "مكافأة جديدة"}</h2>
          <button type="button" className="task-sheet-close" onClick={onClose} aria-label="إغلاق">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isEdit && visibleSuggestions.length > 0 && (
            <>
              <p className="task-sheet-section-label">اقتراحات</p>
              <div className="task-suggestions">
                {visibleSuggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion.name}
                    className="task-suggestion-chip"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.name}
                  </button>
                ))}
              </div>

              <div className="task-sheet-divider">أو أضف مكافأة خاصة</div>
            </>
          )}

          <div className="auth-field">
            <label htmlFor="rewardName">اسم المكافأة</label>
            <div className="auth-input-wrap">
              <input
                id="rewardName"
                type="text"
                placeholder="اسم المكافأة"
                maxLength={NAME_MAX_LENGTH}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="stars-stepper-row">
            <label>عدد النجوم</label>
            <div className="stars-stepper">
              <button
                type="button"
                className="stars-stepper-btn plus"
                onClick={() => setStars((previous) => Math.min(MAX_STARS, previous + STARS_STEP))}
                disabled={stars >= MAX_STARS}
                aria-label="زيادة"
              >
                +
              </button>
              <span className="stars-stepper-value">{stars.toLocaleString("ar-EG")}</span>
              <button
                type="button"
                className="stars-stepper-btn minus"
                onClick={() => setStars((previous) => Math.max(MIN_STARS, previous - STARS_STEP))}
                disabled={stars <= MIN_STARS}
                aria-label="إنقاص"
              >
                &minus;
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit task-sheet-submit" disabled={saving}>
            {saving ? "جاري..." : isEdit ? "حفظ" : "إضافة"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RewardSheet;
