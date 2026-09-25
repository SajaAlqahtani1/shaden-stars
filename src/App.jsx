import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Children from "./pages/Children.jsx";
import AddChild from "./pages/AddChild.jsx";
import Viewer from "./pages/Viewer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Children />
          </ProtectedRoute>
        }
      />
      <Route
        path="/children/new"
        element={
          <ProtectedRoute>
            <AddChild />
          </ProtectedRoute>
        }
      />
      <Route
        path="/children/:id/edit"
        element={
          <ProtectedRoute>
            <AddChild />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/view/:childId" element={<Viewer />} />
    </Routes>
  );
}

export default App;
