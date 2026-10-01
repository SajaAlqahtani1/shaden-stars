import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../context/useAuth.js";
import { getAuthErrorMessage } from "../utils/authErrors.js";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, GoogleIcon } from "../components/icons.jsx";
import gazelleSrc from "../assets/mascot/gazelle.png";
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
      setResetMessage("أرسلنا رابط إعادة التعيين لبريدك، وإذا ما لقيته شيك على الرسائل غير المرغوب فيها (Spam)");
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError));
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
          <h2 className="auth-card-title">أهلا بك</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
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
            <span>المتابعة باستخدام Google</span>
            <GoogleIcon className="auth-google-icon" />
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
