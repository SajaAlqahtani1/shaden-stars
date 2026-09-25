import { signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

function Children() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <h1>أهلا {user?.displayName}</h1>
      <button onClick={() => signOut(auth)}>تسجيل الخروج</button>
    </div>
  );
}

export default Children;
