import { useContext } from "react";
import { AuthContext } from "./authContextObject.js";

export function useAuth() {
  return useContext(AuthContext);
}
