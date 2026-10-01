import { lazy, Suspense } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Each page is loaded only when it is opened, so the child's iPad
// does not download the guardian pages and the first load is smaller.
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const Children = lazy(() => import("./pages/Children.jsx"));
const AddChild = lazy(() => import("./pages/AddChild.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const ManageTasks = lazy(() => import("./pages/ManageTasks.jsx"));
const ManageRewards = lazy(() => import("./pages/ManageRewards.jsx"));
const Viewer = lazy(() => import("./pages/Viewer.jsx"));

function App() {
  return (
    <Suspense fallback={null}>
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
        <Route
          path="/children/:childId/tasks"
          element={
            <ProtectedRoute>
              <ManageTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/children/:childId/rewards"
          element={
            <ProtectedRoute>
              <ManageRewards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/children/:childId"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/view/:childId" element={<Viewer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
