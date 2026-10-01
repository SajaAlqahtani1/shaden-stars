import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../context/useAuth.js";
import { getAuthErrorMessage } from "../utils/authErrors.js";
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon, GoogleIcon } from "../components/icons.jsx";
import gazelleSrc from "../assets/mascot/gazelle.webp";
import "./Auth.css";

const googleProvider = new GoogleAuthProvider();

function Signup() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("الرجاء تعبئة جميع الحقول");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون ٦ أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      refreshUser();
      navigate("/");
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError("");
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (googleError) {
      setError(getAuthErrorMessage(googleError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <img src={gazelleSrc} alt="غزالة نجوم شادن" />
        </div>
        <h1 className="auth-brand-title">نجوم شادن</h1>
        <p className="auth-subtitle">تابع نجوم أطفالك وشجعهم كل يوم</p>

        <div className="auth-card">
          <h2 className="auth-card-title">أنشئ حسابك</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="name">الاسم</label>
              <div className="auth-input-wrap">
                <input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <UserIcon className="auth-input-icon" />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <div className="auth-input-wrap">
                <input
                  id="email"
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <MailIcon className="auth-input-icon" />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">كلمة المرور</label>
              <div className="auth-password-row">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <LockIcon className="auth-input-icon" />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
              <div className="auth-input-wrap">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <LockIcon className="auth-input-icon" />
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "جاري..." : "إنشاء حساب"}
            </button>
          </form>

          <div className="auth-divider">أو</div>

          <button
            type="button"
            className="auth-google-button"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <span>المتابعة باستخدام Google</span>
            <GoogleIcon className="auth-google-icon" />
          </button>

          <p className="auth-bottom-link">
            عندك حساب؟ <Link to="/login">سجل دخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
