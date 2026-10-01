import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/useAuth.js";
import { SmileIcon } from "../components/icons.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { AVATARS, AVATAR_KEYS, getDefaultAvatarKey } from "../components/avatarData.js";
import { IPAD_TASK_NAME, getCalmTaskName, isCalmTaskName } from "../utils/defaultTasks.js";
import girlIconSrc from "../assets/gender/girl.svg";
import boyIconSrc from "../assets/gender/boy.svg";
import "./Auth.css";
import "./Children.css";

function AddChild() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("girl");
  const [originalGender, setOriginalGender] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const selectedAvatar = avatar || getDefaultAvatarKey(gender);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    async function loadChild() {
      const snapshot = await getDoc(doc(db, "children", id));
      if (snapshot.exists()) {
        const data = snapshot.data();
        setName(data.name || "");
        setGender(data.gender || "girl");
        setOriginalGender(data.gender || "girl");
        setAvatar(data.avatar || null);
      }
      setLoading(false);
    }

    loadChild();
  }, [id, isEditMode]);

  async function handleSave(event) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("الرجاء إدخال اسم الطفل");
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        await updateDoc(doc(db, "children", id), {
          name: trimmedName,
          gender,
          avatar: selectedAvatar,
        });

        if (originalGender && originalGender !== gender) {
          const tasksSnapshot = await getDocs(collection(db, "children", id, "tasks"));
          const calmTaskDoc = tasksSnapshot.docs.find((docSnap) => isCalmTaskName(docSnap.data().name));
          if (calmTaskDoc) {
            await updateDoc(doc(db, "children", id, "tasks", calmTaskDoc.id), {
              name: getCalmTaskName(gender),
            });
          }
        }
      } else {
        const childRef = doc(collection(db, "children"));
        await setDoc(childRef, {
          name: trimmedName,
          gender,
          avatar: selectedAvatar,
          guardianId: user.uid,
          totalStars: 0,
          progressStars: 0,
          createdAt: serverTimestamp(),
        });

        const tasksRef = collection(db, "children", childRef.id, "tasks");
        const tasksBatch = writeBatch(db);
        tasksBatch.set(doc(tasksRef), {
          name: IPAD_TASK_NAME,
          stars: 1,
          order: 1,
          createdAt: serverTimestamp(),
        });
        tasksBatch.set(doc(tasksRef), {
          name: getCalmTaskName(gender),
          stars: 1,
          order: 2,
          createdAt: serverTimestamp(),
        });

        await tasksBatch.commit();
      }
      navigate("/");
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <PageHeader title={isEditMode ? "تعديل النجم" : "إضافة نجم"} backTo="/" />

        <div className="add-child-card">
          <form onSubmit={handleSave}>
            <div className="auth-field">
              <label htmlFor="childName">اسم الطفل</label>
              <div className="auth-input-wrap">
                <input
                  id="childName"
                  type="text"
                  placeholder="أدخل اسم الطفل"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <SmileIcon className="auth-input-icon" />
              </div>
            </div>

            <p className="gender-label">الطفل ولد أم بنت؟</p>

            <div className="gender-grid">
              <button
                type="button"
                className={`gender-option${gender === "girl" ? " selected" : ""}`}
                onClick={() => setGender("girl")}
              >
                <img src={girlIconSrc} alt="بنت" className="gender-option-avatar" />
                <span className="gender-option-label">بنت</span>
                <span className="gender-option-radio" />
              </button>

              <button
                type="button"
                className={`gender-option${gender === "boy" ? " selected" : ""}`}
                onClick={() => setGender("boy")}
                data-theme="boy"
              >
                <img src={boyIconSrc} alt="ولد" className="gender-option-avatar" />
                <span className="gender-option-label">ولد</span>
                <span className="gender-option-radio" />
              </button>
            </div>

            <p className="gender-label">اختر الأفاتار</p>

            <div className="avatar-grid">
              {AVATAR_KEYS.map((key) => {
                const { src, label } = AVATARS[key];
                return (
                  <button
                    type="button"
                    key={key}
                    className={`avatar-option${selectedAvatar === key ? " selected" : ""}`}
                    onClick={() => setAvatar(key)}
                  >
                    <span className="avatar-circle avatar-option-circle">
                      <img src={src} alt={label} />
                    </span>
                    <span className="avatar-option-label">{label}</span>
                  </button>
                );
              })}
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit add-child-save" disabled={saving}>
              {saving ? "جاري..." : "حفظ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddChild;
