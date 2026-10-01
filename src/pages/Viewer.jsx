import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js";
import { StarIcon, GiftIcon, SparkleIcon, CheckIcon } from "../components/icons.jsx";
import { formatStarsCount } from "../utils/pluralStars.js";
import { getLocalDateKey } from "../utils/date.js";
import Celebration from "../components/Celebration.jsx";
import gazelleSrc from "../assets/mascot/gazelle.png";
import "./Viewer.css";

const PRAYERS = [
  { key: "fajr", label: "الفجر" },
  { key: "dhuhr", label: "الظهر" },
  { key: "asr", label: "العصر" },
  { key: "maghrib", label: "المغرب" },
  { key: "isha", label: "العشاء" },
];

const PRAYERS_CARD_ID = "prayers";
const MAX_PATH_STARS = 10;
const EMPTY_PATH_STARS = 5;

// Path geometry in percent of the path box. Stars run from right to left
// along a gentle arch, the gazelle starts at the right end and the gift sits at the left end.
const PATH_START_X = 93;
const PATH_FIRST_STAR_X = 82;
const PATH_LAST_STAR_X = 22;
const PATH_GIFT_X = 8;

function getPathY(x) {
  return 68 - 26 * Math.sin((Math.PI * (x - 3)) / 94);
}

function buildPathLine() {
  const points = [];
  for (let x = 97; x >= 3; x -= 2) {
    points.push(`${x},${getPathY(x).toFixed(2)}`);
  }
  return `M ${points.join(" L ")}`;
}

const PATH_LINE = buildPathLine();

function getStarX(index, count) {
  if (count === 1) {
    return PATH_FIRST_STAR_X;
  }
  return PATH_FIRST_STAR_X - (index * (PATH_FIRST_STAR_X - PATH_LAST_STAR_X)) / (count - 1);
}

function getFilledCount(progressStars, starsNeeded, starCount) {
  if (starsNeeded <= MAX_PATH_STARS) {
    return Math.min(progressStars, starCount);
  }
  return Math.min(starCount, Math.floor((progressStars / starsNeeded) * starCount));
}

const CELEBRATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Celebrations already seen on this device are remembered in localStorage,
// so the child view never has to write to Firestore.
function getCelebratedStorageKey(childId) {
  return `celebrated:${childId}`;
}

function readCelebratedIds(childId) {
  try {
    const stored = JSON.parse(localStorage.getItem(getCelebratedStorageKey(childId)));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveCelebratedIds(childId, ids) {
  try {
    localStorage.setItem(getCelebratedStorageKey(childId), JSON.stringify(ids));
  } catch {
    // Storage can be unavailable (private mode); the overlay still closes for this session.
  }
}

function getRecentCelebration(pendingCelebration) {
  if (!pendingCelebration?.rewardId) {
    return null;
  }
  const atMs = pendingCelebration.at?.toMillis?.();
  if (atMs && Date.now() - atMs > CELEBRATION_MAX_AGE_MS) {
    return null;
  }
  return pendingCelebration;
}

function countCheckedPrayers(dayData) {
  return PRAYERS.filter((prayer) => dayData?.prayers?.[prayer.key]).length;
}

// Returns the ids of cards whose stars went up between two versions of the day doc.
function findIncreasedCards(previous, next) {
  const increased = [];
  if (countCheckedPrayers(next) > countCheckedPrayers(previous)) {
    increased.push(PRAYERS_CARD_ID);
  }
  const nextTaskStars = next?.taskStars || {};
  Object.keys(nextTaskStars).forEach((taskId) => {
    if ((nextTaskStars[taskId] || 0) > (previous?.taskStars?.[taskId] || 0)) {
      increased.push(taskId);
    }
  });
  return increased;
}

function Viewer() {
  const { childId } = useParams();

  const [todayKey, setTodayKey] = useState(getLocalDateKey());
  const [child, setChild] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dayData, setDayData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [popCounts, setPopCounts] = useState({});
  const [celebration, setCelebration] = useState(null);
  const [celebratedIds, setCelebratedIds] = useState(() => readCelebratedIds(childId));
  const previousDayRef = useRef(null);

  // The iPad can stay open overnight, so check every minute whether a new day has started.
  useEffect(() => {
    const intervalId = setInterval(() => setTodayKey(getLocalDateKey()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleError = () => {
      setError(true);
      setLoading(false);
    };

    const unsubChild = onSnapshot(
      doc(db, "children", childId),
      (snapshot) => {
        const childData = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
        setChild(childData);
        setCelebration(getRecentCelebration(childData?.pendingCelebration));
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

    previousDayRef.current = null;
    let isFirstDaySnapshot = true;
    const unsubDay = onSnapshot(
      doc(db, "children", childId, "days", todayKey),
      (snapshot) => {
        const nextDay = snapshot.exists() ? snapshot.data() : null;
        if (!isFirstDaySnapshot) {
          const increased = findIncreasedCards(previousDayRef.current, nextDay);
          if (increased.length > 0) {
            setPopCounts((previous) => {
              const updated = { ...previous };
              increased.forEach((cardId) => {
                updated[cardId] = (updated[cardId] || 0) + 1;
              });
              return updated;
            });
          }
        }
        isFirstDaySnapshot = false;
        previousDayRef.current = nextDay;
        setDayData(nextDay);
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
      unsubTasks();
      unsubDay();
      unsubRewards();
    };
  }, [childId, todayKey]);

  if (loading) {
    return (
      <div className="viewer-page">
        <div className="viewer-status">
          <img src={gazelleSrc} alt="" className="viewer-status-image" />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="viewer-page">
        <div className="viewer-status">
          <img src={gazelleSrc} alt="" className="viewer-status-image" />
          <p>الرابط غير صحيح، اطلب من أهلك الرابط الجديد</p>
        </div>
      </div>
    );
  }

  const isBoy = child.gender === "boy";
  const totalStars = child.totalStars || 0;
  const progressStars = child.progressStars || 0;
  const currentReward = rewards.find((reward) => !reward.achieved);

  const starCount = currentReward ? Math.max(1, Math.min(currentReward.starsNeeded, MAX_PATH_STARS)) : EMPTY_PATH_STARS;
  const filledCount = currentReward ? getFilledCount(progressStars, currentReward.starsNeeded, starCount) : 0;
  const gazelleX = filledCount > 0 ? getStarX(filledCount - 1, starCount) : PATH_START_X;
  const starsLeft = currentReward ? Math.max(0, currentReward.starsNeeded - progressStars) : 0;

  const showCelebration = celebration && !celebratedIds.includes(celebration.rewardId);

  function handleCloseCelebration() {
    const updatedIds = [...celebratedIds, celebration.rewardId];
    setCelebratedIds(updatedIds);
    saveCelebratedIds(childId, updatedIds);
  }

  function getCardClassName(cardId) {
    return popCounts[cardId] ? "viewer-task-card pop" : "viewer-task-card";
  }

  function getCardKey(cardId) {
    return `${cardId}-${popCounts[cardId] || 0}`;
  }

  return (
    <div className="viewer-page" data-theme={isBoy ? "boy" : undefined}>
      <div className="viewer-container">
        <header className="viewer-header">
          <div className="viewer-mascot-box">
            <img src={gazelleSrc} alt="غزالة" />
          </div>
          <div>
            <p className="viewer-greeting">أهلاً يا {child.name}! يوم جديد ونجوم جديدة</p>
            <h1 className="viewer-title">نجوم {child.name}</h1>
          </div>
        </header>

        <section className="viewer-card viewer-path-card">
          <div className="viewer-path-top">
            <h2 className="viewer-card-title">طريقك إلى المكافأة</h2>
            <span className="viewer-earned-badge">
              {totalStars > 0 ? `${formatStarsCount(totalStars)} مكتسبة` : formatStarsCount(0)}
              <StarIcon className="viewer-star-filled" />
            </span>
          </div>

          <div className="viewer-path">
            <svg className="viewer-path-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d={PATH_LINE} vectorEffect="non-scaling-stroke" />
            </svg>

            {Array.from({ length: starCount }, (_, index) => {
              const x = getStarX(index, starCount);
              const filled = index < filledCount;
              return (
                <div className="viewer-path-star" key={index} style={{ left: `${x}%`, top: `${getPathY(x)}%` }}>
                  {filled ? (
                    <StarIcon className="viewer-star-filled" />
                  ) : (
                    <StarIcon className="viewer-star-empty" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  )}
                  <span className="viewer-path-number">{(index + 1).toLocaleString("ar-EG")}</span>
                </div>
              );
            })}

            <img
              src={gazelleSrc}
              alt=""
              className="viewer-path-gazelle"
              style={{ left: `${gazelleX}%`, top: `${getPathY(gazelleX)}%` }}
            />

            {currentReward && (
              <div
                className="viewer-path-gift"
                style={{ left: `${PATH_GIFT_X}%`, top: `${getPathY(PATH_GIFT_X)}%` }}
              >
                <GiftIcon />
              </div>
            )}
          </div>

          {!currentReward && <p className="viewer-no-reward">اطلب من أهلك يضيفون مكافأة</p>}
        </section>

        <div className="viewer-section-header">
          <h2 className="viewer-section-title">نجوم مهام اليوم</h2>
          <span className="viewer-cheer">{isBoy ? "أحسنت يا بطل!" : "أحسنتِ يا بطلة!"}</span>
        </div>

        <div className="viewer-tasks-grid">
          <div className={getCardClassName(PRAYERS_CARD_ID)} key={getCardKey(PRAYERS_CARD_ID)}>
            <span className="viewer-task-icon">
              <SparkleIcon />
            </span>
            <h3 className="viewer-task-name">صلاتي</h3>
            <div className="viewer-prayers">
              {PRAYERS.map((prayer) => {
                const done = dayData?.prayers?.[prayer.key] === true;
                return (
                  <div className="viewer-prayer" key={prayer.key}>
                    <span className={`viewer-prayer-circle${done ? " done" : ""}`}>{done && <CheckIcon />}</span>
                    <span className="viewer-prayer-label">{prayer.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {tasks.map((task) => (
            <div className={getCardClassName(task.id)} key={getCardKey(task.id)}>
              <span className="viewer-task-icon">
                <SparkleIcon />
              </span>
              <h3 className="viewer-task-name">{task.name}</h3>
              <span className="viewer-task-badge">
                {(dayData?.taskStars?.[task.id] || 0).toLocaleString("ar-EG")}
                <StarIcon className="viewer-star-filled" />
              </span>
            </div>
          ))}
        </div>

        {currentReward && (
          <section className="viewer-card viewer-next-reward">
            <div className="viewer-next-reward-text">
              <span className="viewer-next-reward-label">مكافأتك القادمة</span>
              <h2 className="viewer-next-reward-name">{currentReward.name}</h2>
              {starsLeft > 0 && (
                <span className="viewer-next-reward-left">
                  باقي {formatStarsCount(starsLeft)} فقط!
                  <StarIcon className="viewer-star-empty" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </span>
              )}
            </div>
            <div className="viewer-next-reward-icon">
              <GiftIcon />
            </div>
          </section>
        )}
      </div>

      {showCelebration && (
        <Celebration
          childName={child.name}
          isBoy={isBoy}
          rewardName={celebration.rewardName}
          onClose={handleCloseCelebration}
        />
      )}
    </div>
  );
}

export default Viewer;
