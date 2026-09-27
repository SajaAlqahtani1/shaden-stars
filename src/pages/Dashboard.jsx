import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, doc, increment, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js";
import { BackArrowIcon, StarIcon, GiftIcon, SparkleIcon, CheckIcon, PlusIcon } from "../components/icons.jsx";
import { Avatar } from "../components/avatars.jsx";
import { formatStarsCount } from "../utils/pluralStars.js";
import { getLocalDateKey } from "../utils/date.js";
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
  const todayKey = getLocalDateKey();

  const [child, setChild] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dayData, setDayData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

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

  useEffect(() => () => clearTimeout(toastTimeoutRef.current), []);

  useEffect(() => {
    if (!child || child.gender !== "boy" || tasks.length === 0) {
      return;
    }

    const wrongTask = tasks.find((task) => task.name === CALM_TASK_NAME_GIRL);
    if (wrongTask) {
      updateDoc(doc(db, "children", childId, "tasks", wrongTask.id), {
        name: getCalmTaskName("boy"),
      });
    }
  }, [child, tasks, childId]);

  async function applyStarDelta(taskId, delta) {
    const batch = writeBatch(db);
    const childRef = doc(db, "children", childId);
    const dayRef = doc(db, "children", childId, "days", todayKey);

    batch.set(dayRef, { taskStars: { [taskId]: increment(delta) } }, { merge: true });
    batch.update(childRef, { totalStars: increment(delta), progressStars: increment(delta) });

    await batch.commit();
  }

  async function handleAddTaskStar(task) {
    await applyStarDelta(task.id, task.stars);

    clearTimeout(toastTimeoutRef.current);
    setToast({ taskId: task.id, taskName: task.name, delta: task.stars });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 5000);
  }

  async function handleUndo() {
    if (!toast) {
      return;
    }
    clearTimeout(toastTimeoutRef.current);
    const { taskId, delta } = toast;
    setToast(null);
    await applyStarDelta(taskId, -delta);
  }

  async function handleTogglePrayer(prayerKey) {
    const isChecked = Boolean(dayData?.prayers?.[prayerKey]);
    const delta = isChecked ? -1 : 1;

    const batch = writeBatch(db);
    const childRef = doc(db, "children", childId);
    const dayRef = doc(db, "children", childId, "days", todayKey);

    batch.set(dayRef, { prayers: { [prayerKey]: !isChecked } }, { merge: true });
    batch.update(childRef, { totalStars: increment(delta), progressStars: increment(delta) });

    await batch.commit();
  }

  if (loading) {
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
        <div className="dashboard-header">
          <button type="button" className="dashboard-back" onClick={() => navigate("/")} aria-label="رجوع">
            <BackArrowIcon />
          </button>

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
        </div>

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
                  {progressStars.toLocaleString("ar-EG")} من {currentReward.starsNeeded.toLocaleString("ar-EG")} نجوم
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
            <span className="dashboard-toast-text">أضفت نجمة لـ{toast.taskName}</span>
            <button type="button" className="dashboard-toast-undo" onClick={handleUndo}>
              تراجع
            </button>
          </div>
        )}

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
