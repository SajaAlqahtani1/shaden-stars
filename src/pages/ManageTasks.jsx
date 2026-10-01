import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/useAuth.js";
import { SparkleIcon, EditIcon, TrashIcon, LockIcon, PlusIcon } from "../components/icons.jsx";
import TaskSheet from "../components/TaskSheet.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { formatStarsCount } from "../utils/pluralStars.js";
import "./Auth.css";
import "./Children.css";
import "./Dashboard.css";
import "./ManageTasks.css";

function ManageTasks() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [child, setChild] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const handleError = () => {
      setError("تعذر تحميل البيانات، حاول مرة أخرى لاحقا");
      setLoading(false);
    };

    const unsubChild = onSnapshot(
      doc(db, "children", childId),
      (snapshot) => {
        setChild(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      handleError
    );

    const tasksQuery = query(collection(db, "children", childId, "tasks"), orderBy("order"));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot) => setTasks(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
      handleError
    );

    return () => {
      unsubChild();
      unsubTasks();
    };
  }, [childId]);

  useEffect(() => {
    if (child && user && child.guardianId !== user.uid) {
      navigate("/");
    }
  }, [child, user, navigate]);

  function handleOpenAddSheet() {
    setEditingTask(null);
    setSheetOpen(true);
  }

  function handleOpenEditSheet(task) {
    setEditingTask(task);
    setSheetOpen(true);
  }

  function handleCloseSheet() {
    setSheetOpen(false);
    setEditingTask(null);
  }

  async function handleSubmitTask({ name, stars }) {
    if (editingTask) {
      await updateDoc(doc(db, "children", childId, "tasks", editingTask.id), { name, stars });
    } else {
      const maxOrder = tasks.reduce((max, task) => Math.max(max, task.order || 0), 0);
      await addDoc(collection(db, "children", childId, "tasks"), {
        name,
        stars,
        order: maxOrder + 1,
      });
    }
    handleCloseSheet();
  }

  async function handleDeleteTask(task) {
    const confirmed = window.confirm(`هل تريد حذف مهمة "${task.name}"؟`);
    if (confirmed) {
      await deleteDoc(doc(db, "children", childId, "tasks", task.id));
    }
  }

  if (loading) {
    return null;
  }

  if (error || !child) {
    return (
      <div className="manage-tasks-page">
        <div className="manage-tasks-container">
          <p className="dashboard-error">{error || "لم يتم العثور على هذا الطفل"}</p>
        </div>
      </div>
    );
  }

  const isBoy = child.gender === "boy";
  const existingNames = tasks.map((task) => task.name).concat("الصلوات");

  return (
    <div className="manage-tasks-page" data-theme={isBoy ? "boy" : undefined}>
      <div className="manage-tasks-container">
        <PageHeader title="إدارة المهام" backTo={`/children/${childId}`} />

        <h2 className="manage-tasks-section-title">المهام الحالية</h2>

        <div className="manage-tasks-list">
          <div className="task-card">
            <div className="task-row">
              <div className="task-name-group">
                <span className="task-card-icon">
                  <SparkleIcon />
                </span>
                <div className="task-name-col">
                  <span className="task-name">الصلوات</span>
                  <span className="task-today-badge">{formatStarsCount(5)} يومياً</span>
                </div>
              </div>
              <span className="manage-task-locked">
                <LockIcon />
                ثابتة
              </span>
            </div>
          </div>

          {tasks.map((task) => (
            <div className="task-card" key={task.id}>
              <div className="task-row">
                <div className="task-name-group">
                  <span className="task-card-icon">
                    <SparkleIcon />
                  </span>
                  <div className="task-name-col">
                    <span className="task-name">{task.name}</span>
                    <span className="task-today-badge">{formatStarsCount(task.stars)}</span>
                  </div>
                </div>
                <div className="manage-task-actions">
                  <button
                    type="button"
                    className="manage-task-icon-btn edit"
                    onClick={() => handleOpenEditSheet(task)}
                    aria-label="تعديل"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="manage-task-icon-btn delete"
                    onClick={() => handleDeleteTask(task)}
                    aria-label="حذف"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="children-add-button" onClick={handleOpenAddSheet}>
          <PlusIcon />
          مهمة جديدة
        </button>
      </div>

      {sheetOpen && (
        <TaskSheet
          initialTask={editingTask}
          existingNames={existingNames}
          onClose={handleCloseSheet}
          onSubmit={handleSubmitTask}
        />
      )}
    </div>
  );
}

export default ManageTasks;
