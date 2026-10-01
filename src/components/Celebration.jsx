import { StarIcon, GiftIcon, BackArrowIcon } from "./icons.jsx";
import gazelleHappySrc from "../assets/mascot/gazelle-happy.png";
import "./Celebration.css";

// Fixed positions so the confetti looks the same on every render.
// left is in percent, delay and duration in seconds.
const CONFETTI = [
  { left: 6, delay: 0, duration: 4.2, kind: "star" },
  { left: 13, delay: 1.4, duration: 5.1, kind: "piece", color: "primary" },
  { left: 21, delay: 0.6, duration: 4.6, kind: "dot", color: "gold" },
  { left: 29, delay: 2.2, duration: 5.4, kind: "piece", color: "gold" },
  { left: 36, delay: 0.3, duration: 4.0, kind: "star" },
  { left: 44, delay: 1.8, duration: 5.0, kind: "dot", color: "primary" },
  { left: 52, delay: 0.9, duration: 4.4, kind: "piece", color: "light" },
  { left: 59, delay: 2.6, duration: 5.6, kind: "star" },
  { left: 66, delay: 0.2, duration: 4.8, kind: "piece", color: "primary" },
  { left: 73, delay: 1.2, duration: 4.1, kind: "dot", color: "gold" },
  { left: 80, delay: 2.0, duration: 5.3, kind: "star" },
  { left: 87, delay: 0.5, duration: 4.5, kind: "piece", color: "gold" },
  { left: 94, delay: 1.6, duration: 5.2, kind: "dot", color: "primary" },
  { left: 17, delay: 3.0, duration: 4.9, kind: "star" },
  { left: 48, delay: 3.4, duration: 4.3, kind: "piece", color: "gold" },
  { left: 83, delay: 3.2, duration: 4.7, kind: "piece", color: "light" },
];

function Celebration({ childName, isBoy, rewardName, onClose }) {
  return (
    <div className="celebration-overlay" data-theme={isBoy ? "boy" : undefined} role="dialog" aria-modal="true">
      <div className="celebration-confetti" aria-hidden="true">
        {CONFETTI.map((item, index) => (
          <span
            key={index}
            className={`celebration-falling ${item.kind}${item.color ? ` ${item.color}` : ""}`}
            style={{ left: `${item.left}%`, animationDelay: `${item.delay}s`, animationDuration: `${item.duration}s` }}
          >
            {item.kind === "star" && <StarIcon />}
          </span>
        ))}
      </div>

      <div className="celebration-content">
        <h1 className="celebration-title">مبروك يا {childName}!</h1>
        <p className="celebration-subtitle">{isBoy ? "وصلت لمكافأتك" : "وصلتِ لمكافأتك"}</p>

        <div className="celebration-stage">
          <div className="celebration-circle" />
          <img src={gazelleHappySrc} alt="غزالة سعيدة" className="celebration-gazelle" />
          <div className="celebration-ground" />
        </div>

        <div className="celebration-reward">
          <div className="celebration-reward-text">
            <span className="celebration-reward-label">
              {isBoy ? "مكافأتك" : "مكافأتكِ"}
              <StarIcon />
            </span>
            <h2 className="celebration-reward-name">{rewardName}</h2>
            <span className="celebration-reward-cheer">{isBoy ? "تستحقها يا بطل!" : "تستحقينها يا بطلة!"}</span>
          </div>
          <div className="celebration-reward-icon">
            <GiftIcon />
          </div>
        </div>

        <button type="button" className="celebration-button" onClick={onClose}>
          رجوع لنجومي
          <BackArrowIcon />
        </button>
      </div>
    </div>
  );
}

export default Celebration;
