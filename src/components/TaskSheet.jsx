import { useState } from "react";
import { CloseIcon } from "./icons.jsx";
import { TASK_SUGGESTIONS } from "../utils/taskSuggestions.js";

const NAME_MAX_LENGTH = 40;

// Mounted only while open, so each opening starts with fresh state.
function TaskSheet({ initialTask, existingNames, onClose, onSubmit }) {
  const [name, setName] = useState(initialTask ? initialTask.name : "");
  const [stars, setStars] = useState(initialTask ? initialTask.stars : 1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initialTask);
  const otherNames = existingNames.filter((existingName) => existingName !== initialTask?.name);
  const visibleSuggestions = TASK_SUGGESTIONS.filter((suggestion) => !otherNames.includes(suggestion));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("الرجاء إدخال اسم المهمة");
      return;
    }

    if (otherNames.includes(trimmedName)) {
      setError("توجد مهمة بهذا الاسم بالفعل");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ name: trimmedName, stars });
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
          <h2 className="task-sheet-title">{isEdit ? "تعديل المهمة" : "مهمة جديدة"}</h2>
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
                    key={suggestion}
                    className="task-suggestion-chip"
                    onClick={() => setName(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="task-sheet-divider">أو أضف مهمة خاصة</div>
            </>
          )}

          <div className="auth-field">
            <label htmlFor="taskName">اسم المهمة</label>
            <div className="auth-input-wrap">
              <input
                id="taskName"
                type="text"
                placeholder="اسم المهمة"
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
                onClick={() => setStars((previous) => Math.min(5, previous + 1))}
                disabled={stars >= 5}
                aria-label="زيادة"
              >
                +
              </button>
              <span className="stars-stepper-value">{stars.toLocaleString("ar-EG")}</span>
              <button
                type="button"
                className="stars-stepper-btn minus"
                onClick={() => setStars((previous) => Math.max(1, previous - 1))}
                disabled={stars <= 1}
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

export default TaskSheet;
