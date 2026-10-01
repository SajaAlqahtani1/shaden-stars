import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { useAuth } from "../context/useAuth.js";
import ChildCard from "../components/ChildCard.jsx";
import { PlusIcon, StarIcon } from "../components/icons.jsx";
import "./Children.css";

function Children() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const childrenQuery = query(collection(db, "children"), where("guardianId", "==", user.uid));

    const unsubscribe = onSnapshot(
      childrenQuery,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setChildren(list);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل البيانات، حاول مرة أخرى لاحقا");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user.uid]);

  async function handleDeleteChild(childId) {
    await deleteDoc(doc(db, "children", childId));
  }

  return (
    <div className="children-page">
      <div className="children-container">
        <button type="button" className="children-signout" onClick={() => signOut(auth)}>
          تسجيل الخروج
        </button>

        <h1 className="children-title">نجومي الصغار</h1>
        <p className="children-subtitle">تابـع تقـدّمهم وشجّـعهم!</p>

        {error && <p className="children-error">{error}</p>}

        {!loading && !error && children.length === 0 && (
          <div className="children-empty">
            <StarIcon className="children-empty-icon" />
            <h2 className="children-empty-title">أضف أول نجم</h2>
            <p className="children-empty-subtitle">أضف طفلك الأول لتبدأ رحلة النجوم والمكافآت</p>
          </div>
        )}

        {children.length > 0 && (
          <div className="children-list">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} onDelete={handleDeleteChild} />
            ))}
          </div>
        )}

        {children.length === 0 ? null : <div className="children-spacer" />}

        <button type="button" className="children-add-button" onClick={() => navigate("/children/new")}>
          <PlusIcon />
          إضافة نجم
        </button>
      </div>
    </div>
  );
}

export default Children;
