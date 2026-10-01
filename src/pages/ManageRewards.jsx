import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/useAuth.js";
import { EditIcon, TrashIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, CheckIcon } from "../components/icons.jsx";
import PageHeader from "../components/PageHeader.jsx";
import RewardSheet from "../components/RewardSheet.jsx";
import { formatStarsCount } from "../utils/pluralStars.js";
import { SAVE_ERROR_MESSAGE } from "../utils/errors.js";
import { useDocumentTheme } from "../hooks/useDocumentTheme.js";
import "./Auth.css";
import "./Children.css";
import "./Dashboard.css";
import "./ManageTasks.css";
import "./ManageRewards.css";

function formatAchievedDate(achievedAt) {
  if (!achievedAt?.toDate) {
    return "";
  }
  return achievedAt.toDate().toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
}

function ManageRewards() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [child, setChild] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [saveError, setSaveError] = useState("");

  useDocumentTheme(child?.gender === "boy");

  useEffect(() => {
    const handleError = () => {
      setError("تعذر تحميل البيانات، حاول مرة أخرى لاحقا");
      setLoading(false);
    };

    const unsubChild = onSnapshot(
      doc(db, "children", childId),
      (snapshot) => {
        setChild(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      handleError
    );

    const rewardsQuery = query(collection(db, "children", childId, "rewards"), orderBy("order"));
    const unsubRewards = onSnapshot(
      rewardsQuery,
      (snapshot) => setRewards(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
      handleError
    );

    return () => {
      unsubChild();
      unsubRewards();
    };
  }, [childId]);

  useEffect(() => {
    if (child && user && child.guardianId !== user.uid) {
      navigate("/");
    }
  }, [child, user, navigate]);

  function handleOpenAddSheet() {
    setEditingReward(null);
    setSheetOpen(true);
  }

  function handleOpenEditSheet(reward) {
    setEditingReward(reward);
    setSheetOpen(true);
  }

  function handleCloseSheet() {
    setSheetOpen(false);
    setEditingReward(null);
  }

  function showSaveError() {
    setSaveError(SAVE_ERROR_MESSAGE);
  }

  // Writes are not awaited: the list updates right away from the local cache,
  // and a failure shows a message instead of leaving the sheet stuck on "جاري...".
  function handleSubmitReward({ name, starsNeeded }) {
    setSaveError("");
    if (editingReward) {
      updateDoc(doc(db, "children", childId, "rewards", editingReward.id), { name, starsNeeded }).catch(
        showSaveError
      );
    } else {
      const maxOrder = rewards.reduce((max, reward) => Math.max(max, reward.order || 0), 0);
      addDoc(collection(db, "children", childId, "rewards"), {
        name,
        starsNeeded,
        order: maxOrder + 1,
        achieved: false,
        createdAt: serverTimestamp(),
      }).catch(showSaveError);
    }
    handleCloseSheet();
  }

  function handleDeleteReward(reward) {
    const confirmed = window.confirm(`هل تريد حذف مكافأة "${reward.name}"؟`);
    if (confirmed) {
      setSaveError("");
      deleteDoc(doc(db, "children", childId, "rewards", reward.id)).catch(showSaveError);
    }
  }

  function handleSwapOrder(first, second) {
    const batch = writeBatch(db);
    batch.update(doc(db, "children", childId, "rewards", first.id), { order: second.order });
    batch.update(doc(db, "children", childId, "rewards", second.id), { order: first.order });
    setSaveError("");
    batch.commit().catch(showSaveError);
  }

  if (loading || (child && user && child.guardianId !== user.uid)) {
    return null;
  }

  if (error || !child) {
    return (
      <div className="manage-tasks-page">
        <div className="manage-tasks-container">
          <p className="dashboard-error">{error || "لم يتم العثور على هذا الطفل"}</p>
        </div>
      </div>
    );
  }

  const isBoy = child.gender === "boy";
  const progressStars = child.progressStars || 0;
  const upcomingRewards = rewards.filter((reward) => !reward.achieved);
  const achievedRewards = rewards
    .filter((reward) => reward.achieved)
    .sort((a, b) => (b.achievedAt?.toMillis?.() || 0) - (a.achievedAt?.toMillis?.() || 0));
  const upcomingNames = upcomingRewards.map((reward) => reward.name);

  return (
    <div className="manage-tasks-page" data-theme={isBoy ? "boy" : undefined}>
      <div className="manage-tasks-container">
        <PageHeader title="المكافآت" backTo={`/children/${childId}`} />

        <h2 className="manage-tasks-section-title">المكافآت القادمة</h2>

        {upcomingRewards.length === 0 ? (
          <p className="rewards-empty">لا توجد مكافآت قادمة، أضف مكافأة جديدة</p>
        ) : (
          <div className="manage-tasks-list">
            {upcomingRewards.map((reward, index) => {
              const isCurrent = index === 0;
              const previous = upcomingRewards[index - 1];
              const next = upcomingRewards[index + 1];
              return (
                <div className={`task-card reward-row${isCurrent ? " current" : ""}`} key={reward.id}>
                  <div className="task-row">
                    <div className="task-name-group">
                      <span className="reward-number">{(index + 1).toLocaleString("ar-EG")}</span>
                      <div className="task-name-col">
                        <div className="reward-name-line">
                          <span className="task-name">{reward.name}</span>
                          {isCurrent && <span className="reward-current-label">الحالية</span>}
                        </div>
                        <span className="task-today-badge">
                          {isCurrent
                            ? `${progressStars.toLocaleString("ar-EG")} من ${formatStarsCount(reward.starsNeeded)}`
                            : formatStarsCount(reward.starsNeeded)}
                        </span>
                      </div>
                    </div>

                    <div className="manage-task-actions">
                      <div className="reward-reorder">
                        <button
                          type="button"
                          className="reward-reorder-btn"
                          onClick={() => handleSwapOrder(reward, previous)}
                          disabled={!previous}
                          aria-label="تحريك للأعلى"
                        >
                          <ChevronUpIcon />
                        </button>
                        <button
                          type="button"
                          className="reward-reorder-btn"
                          onClick={() => handleSwapOrder(reward, next)}
                          disabled={!next}
                          aria-label="تحريك للأسفل"
                        >
                          <ChevronDownIcon />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="manage-task-icon-btn edit"
                        onClick={() => handleOpenEditSheet(reward)}
                        aria-label="تعديل"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="manage-task-icon-btn delete"
                        onClick={() => handleDeleteReward(reward)}
                        aria-label="حذف"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {achievedRewards.length > 0 && (
          <>
            <h2 className="manage-tasks-section-title">تم الحصول عليها</h2>
            <div className="manage-tasks-list">
              {achievedRewards.map((reward) => (
                <div className="task-card reward-row achieved" key={reward.id}>
                  <div className="task-row">
                    <div className="task-name-group">
                      <span className="reward-number">
                        <CheckIcon />
                      </span>
                      <div className="task-name-col">
                        <span className="task-name">{reward.name}</span>
                        <span className="task-today-badge">
                          {formatStarsCount(reward.starsNeeded)}
                          {reward.achievedAt && ` · ${formatAchievedDate(reward.achievedAt)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {saveError && <p className="dashboard-error dashboard-save-error">{saveError}</p>}

        <button type="button" className="children-add-button" onClick={handleOpenAddSheet}>
          <PlusIcon />
          مكافأة جديدة
        </button>
      </div>

      {sheetOpen && (
        <RewardSheet
          initialReward={editingReward}
          existingNames={upcomingNames}
          onClose={handleCloseSheet}
          onSubmit={handleSubmitReward}
        />
      )}
    </div>
  );
}

export default ManageRewards;
