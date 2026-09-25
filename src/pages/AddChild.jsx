import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { BackArrowIcon, SmileIcon, GirlAvatarIcon, BoyAvatarIcon } from "../components/icons.jsx";
import "./Auth.css";
import "./Children.css";

function AddChild() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("girl");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

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
        });
      } else {
        await addDoc(collection(db, "children"), {
          name: trimmedName,
          gender,
          guardianId: user.uid,
          totalStars: 0,
          createdAt: serverTimestamp(),
        });
      }
      navigate("/");
    } catch (saveError) {
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
        <div className="add-child-header">
          <h1 className="add-child-title">{isEditMode ? "تعديل النجم" : "إضافة نجم"}</h1>
          <button
            type="button"
            className="add-child-back"
            onClick={() => navigate("/")}
            aria-label="رجوع"
          >
            <BackArrowIcon />
          </button>
        </div>

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
                <GirlAvatarIcon className="gender-option-avatar" />
                <span className="gender-option-label">بنت</span>
                <span className="gender-option-radio" />
              </button>

              <button
                type="button"
                className={`gender-option${gender === "boy" ? " selected" : ""}`}
                onClick={() => setGender("boy")}
              >
                <BoyAvatarIcon className="gender-option-avatar" />
                <span className="gender-option-label">ولد</span>
                <span className="gender-option-radio" />
              </button>
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
