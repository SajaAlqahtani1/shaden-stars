import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  collection,
  deleteField,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { StarIcon, GiftIcon, SparkleIcon, CheckIcon, PlusIcon, CloseIcon } from "../components/icons.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { Avatar } from "../components/avatars.jsx";
import { formatStarsCount } from "../utils/pluralStars.js";
import { SAVE_ERROR_MESSAGE } from "../utils/errors.js";
import { useTodayKey } from "../hooks/useTodayKey.js";
import { useDocumentTheme } from "../hooks/useDocumentTheme.js";
import { useAuth } from "../context/useAuth.js";
import { CALM_TASK_NAME_GIRL, getCalmTaskName } from "../utils/defaultTasks.js";
import "./Dashboard.css";

const PRAYERS = [
  { key: "fajr", label: "الفجر" },
  { key: "dhuhr", label: "الظهر" },
  { key: "asr", label: "العصر" },
  { key: "maghrib", label: "المغرب" },
  { key: "isha", label: "العشاء" },
];

function Dashboard() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const todayKey = useTodayKey();

  const [child, setChild] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dayData, setDayData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [saveError, setSaveError] = useState("");
  const toastTimeoutRef = useRef(null);
  const lastPrayerAchievementRef = useRef(null);

  const isOwner = Boolean(child && user && child.guardianId === user.uid);
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

    const tasksQuery = query(collection(db, "children", childId, "tasks"), orderBy("order"));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot) => setTasks(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
      handleError
    );

    const unsubDay = onSnapshot(
      doc(db, "children", childId, "days", todayKey),
      (snapshot) => setDayData(snapshot.exists() ? snapshot.data() : null),
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
      unsubTasks();
      unsubDay();
      unsubRewards();
    };
  }, [childId, todayKey]);

  useEffect(() => {
    if (child && user && child.guardianId !== user.uid) {
      navigate("/");
    }
  }, [child, user, navigate]);

  useEffect(() => () => clearTimeout(toastTimeoutRef.current), []);

  useEffect(() => {
    if (!isOwner || child.gender !== "boy" || tasks.length === 0) {
      return;
    }

    const wrongTask = tasks.find((task) => task.name === CALM_TASK_NAME_GIRL);
    if (wrongTask) {
      updateDoc(doc(db, "children", childId, "tasks", wrongTask.id), {
        name: getCalmTaskName("boy"),
      }).catch(() => {});
    }
  }, [isOwner, child, tasks, childId]);

  function showSaveError() {
    setSaveError(SAVE_ERROR_MESSAGE);
  }

  // Adds (or removes) stars in one batch. If the added stars reach the current reward,
  // the same batch marks it achieved and keeps only the extra stars in progressStars.
  // Pass undoAchievement to reverse a reward that the undone stars had unlocked.
  // The screen updates right away from the local cache; we don't wait for the server,
  // so it stays responsive on slow internet and offline (Firestore sends it when back online).
  function applyStarChange(dayUpdate, delta, undoAchievement = null) {
    const batch = writeBatch(db);
    const childRef = doc(db, "children", childId);
    const dayRef = doc(db, "children", childId, "days", todayKey);

    const progressStars = child.progressStars || 0;
    const currentReward = rewards.find((reward) => !reward.achieved);
    const childUpdate = { totalStars: increment(delta) };
    let achievement = null;

    if (undoAchievement) {
      batch.update(doc(db, "children", childId, "rewards", undoAchievement.rewardId), {
        achieved: false,
        achievedAt: deleteField(),
      });
      childUpdate.progressStars = increment(delta + undoAchievement.starsNeeded);
      childUpdate.pendingCelebration = deleteField();
    } else if (delta > 0 && currentReward && progressStars + delta >= currentReward.starsNeeded) {
      achievement = {
        rewardId: currentReward.id,
        rewardName: currentReward.name,
        starsNeeded: currentReward.starsNeeded,
      };
      batch.update(doc(db, "children", childId, "rewards", currentReward.id), {
        achieved: true,
        achievedAt: serverTimestamp(),
      });
      childUpdate.progressStars = increment(delta - currentReward.starsNeeded);
      childUpdate.pendingCelebration = {
        rewardId: currentReward.id,
        rewardName: currentReward.name,
        at: serverTimestamp(),
      };
    } else if (progressStars + delta < 0) {
      childUpdate.progressStars = 0;
    } else {
      childUpdate.progressStars = increment(delta);
    }

    batch.set(dayRef, dayUpdate, { merge: true });
    batch.update(childRef, childUpdate);
    setSaveError("");
    batch.commit().catch(showSaveError);

    return achievement;
  }

  function handleAddTaskStar(task) {
    const delta = task.stars;
    const achievement = applyStarChange({ taskStars: { [task.id]: increment(delta) } }, delta);
    lastPrayerAchievementRef.current = null;
    if (achievement) {
      setCelebration(achievement);
    }

    clearTimeout(toastTimeoutRef.current);
    setToast({ taskId: task.id, taskName: task.name, delta, achievement });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 5000);
  }

  function handleUndo() {
    if (!toast) {
      return;
    }
    clearTimeout(toastTimeoutRef.current);
    const { taskId, delta, achievement } = toast;
    setToast(null);
    if (achievement) {
      setCelebration(null);
    }
    applyStarChange({ taskStars: { [taskId]: increment(-delta) } }, -delta, achievement);
  }

  function handleTogglePrayer(prayerKey) {
    const isChecked = Boolean(dayData?.prayers?.[prayerKey]);
    const dayUpdate = { prayers: { [prayerKey]: !isChecked } };

    if (isChecked) {
      // Unchecking the prayer that just unlocked a reward reverses that reward too.
      const lastAchievement = lastPrayerAchievementRef.current;
      const undoAchievement = lastAchievement?.prayerKey === prayerKey ? lastAchievement.achievement : null;
      lastPrayerAchievementRef.current = null;
      if (undoAchievement) {
        setCelebration(null);
      }
      applyStarChange(dayUpdate, -1, undoAchievement);
      return;
    }

    const achievement = applyStarChange(dayUpdate, 1);
    lastPrayerAchievementRef.current = achievement ? { prayerKey, achievement } : null;
    if (achievement) {
      setCelebration(achievement);
    }
  }

  if (loading || (child && !isOwner)) {
    return null;
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <p className="dashboard-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <p className="dashboard-error">لم يتم العثور على هذا الطفل</p>
          <Link to="/" className="reward-empty-link">الرجوع إلى الصفحة الرئيسية</Link>
        </div>
      </div>
    );
  }

  const isBoy = child.gender === "boy";
  const currentReward = rewards.find((reward) => !reward.achieved);
  const progressStars = child.progressStars || 0;
  const progressPercent =
    currentReward && currentReward.starsNeeded > 0
      ? Math.min(100, (progressStars / currentReward.starsNeeded) * 100)
      : 0;

  return (
    <div className="dashboard-page" data-theme={isBoy ? "boy" : undefined}>
      <div className="dashboard-container">
        <PageHeader backTo="/">
          <div className="dashboard-child-info">
            <Avatar avatar={child.avatar} gender={child.gender} className="dashboard-avatar" />
            <div>
              <h1 className="dashboard-name">{child.name}</h1>
              <div className="dashboard-stars">
                <StarIcon />
                <span>{formatStarsCount(child.totalStars || 0)}</span>
              </div>
            </div>
          </div>
        </PageHeader>

        {celebration && (
          <div className="celebration-banner">
            <span className="celebration-banner-icon">
              <GiftIcon />
            </span>
            <span className="celebration-banner-text">
              {isBoy ? "وصل" : "وصلت"} {child.name} للمكافأة: {celebration.rewardName}
            </span>
            <button
              type="button"
              className="celebration-banner-close"
              onClick={() => setCelebration(null)}
              aria-label="إغلاق"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <div className="reward-card">
          {currentReward ? (
            <>
              <div className="reward-card-top">
                <div className="reward-card-title-group">
                  <span className="reward-card-icon">
                    <GiftIcon />
                  </span>
                  <span className="reward-card-name">{currentReward.name}</span>
                </div>
                <span className="reward-card-progress-pill">
                  {progressStars.toLocaleString("ar-EG")} من {formatStarsCount(currentReward.starsNeeded)}
                </span>
              </div>
              <div className="reward-progress-track">
                <div className="reward-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </>
          ) : (
            <div className="reward-empty">
              <p className="reward-empty-text">لا توجد مكافأة بعد</p>
              <Link to={`/children/${childId}/rewards`} className="reward-empty-link">
                أضف مكافأة
              </Link>
            </div>
          )}
        </div>

        <h2 className="dashboard-section-title">مهام اليوم</h2>

        <div className="task-card">
          <div className="task-card-header">
            <span className="task-card-icon">
              <SparkleIcon />
            </span>
            <span className="task-card-title">الصلوات</span>
          </div>
          <div className="prayers-row">
            {PRAYERS.map((prayer) => {
              const checked = Boolean(dayData?.prayers?.[prayer.key]);
              return (
                <button
                  type="button"
                  key={prayer.key}
                  className="prayer-item"
                  onClick={() => handleTogglePrayer(prayer.key)}
                >
                  <span className={`prayer-circle${checked ? " checked" : ""}`}>
                    {checked && <CheckIcon />}
                  </span>
                  <span className="prayer-label">{prayer.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {tasks.map((task) => {
          const starsToday = dayData?.taskStars?.[task.id] || 0;
          return (
            <div className="task-card" key={task.id}>
              <div className="task-row">
                <div className="task-name-group">
                  <span className="task-card-icon">
                    <SparkleIcon />
                  </span>
                  <div className="task-name-col">
                    <span className="task-name">{task.name}</span>
                    {starsToday > 0 && (
                      <span className="task-today-badge">{formatStarsCount(starsToday)} اليوم</span>
                    )}
                  </div>
                </div>
                <button type="button" className="task-add-button" onClick={() => handleAddTaskStar(task)}>
                  <PlusIcon />
                  نجمة
                </button>
              </div>
            </div>
          );
        })}

        {toast && (
          <div className="dashboard-toast">
            <span className="dashboard-toast-text">
              أضفت {formatStarsCount(toast.delta)} لـ{toast.taskName}
            </span>
            <button type="button" className="dashboard-toast-undo" onClick={handleUndo}>
              تراجع
            </button>
          </div>
        )}

        {saveError && <p className="dashboard-error dashboard-save-error">{saveError}</p>}

        <div className="dashboard-bottom-row">
          <button
            type="button"
            className="dashboard-bottom-button"
            onClick={() => navigate(`/children/${childId}/rewards`)}
          >
            المكافآت
          </button>
          <button
            type="button"
            className="dashboard-bottom-button"
            onClick={() => navigate(`/children/${childId}/tasks`)}
          >
            إدارة المهام
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
