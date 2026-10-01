import { useNavigate } from "react-router-dom";
import { BackArrowIcon } from "./icons.jsx";
import "./PageHeader.css";

function PageHeader({ title, backTo, children }) {
  const navigate = useNavigate();

  return (
    <div className="page-header">
      <button type="button" className="page-header-back" onClick={() => navigate(backTo)} aria-label="رجوع">
        <BackArrowIcon />
      </button>
      {children || <h1 className="page-header-title">{title}</h1>}
    </div>
  );
}

export default PageHeader;
