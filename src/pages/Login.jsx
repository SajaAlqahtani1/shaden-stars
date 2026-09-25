import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getAuthErrorMessage } from "../utils/authErrors.js";
import "./Auth.css";

const googleProvider = new GoogleAuthProvider();

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setResetMessage("");
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

  async function handleForgotPassword() {
    setError("");
    setResetMessage("");

    if (!email) {
      setError("اكتب بريدك الإلكتروني أولا");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك");
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError));
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo" />
        <h1 className="auth-brand-title">نجوم شادن</h1>
        <p className="auth-subtitle">تابع نجوم أطفالك وشجعهم كل يوم</p>

        <div className="auth-card">
          <h2 className="auth-card-title">أهلا بك</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">كلمة المرور</label>
              <div className="auth-password-row">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="auth-forgot-link"
              onClick={handleForgotPassword}
            >
              نسيت كلمة المرور؟
            </button>

            {error && <p className="auth-error">{error}</p>}
            {resetMessage && <p className="auth-success">{resetMessage}</p>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "جاري..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="auth-divider">أو</div>

          <button
            type="button"
            className="auth-google-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            المتابعة باستخدام Google
          </button>

          <p className="auth-bottom-link">
            ما عندك حساب؟ <Link to="/signup">أنشئ حساب</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
