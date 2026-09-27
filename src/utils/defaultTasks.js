export const IPAD_TASK_NAME = "وقت الآيباد";
export const CALM_TASK_NAME_GIRL = "بقيتُ هادئة";
export const CALM_TASK_NAME_BOY = "بقيتُ هادئًا";

export function getCalmTaskName(gender) {
  return gender === "boy" ? CALM_TASK_NAME_BOY : CALM_TASK_NAME_GIRL;
}

export function isCalmTaskName(name) {
  return name === CALM_TASK_NAME_GIRL || name === CALM_TASK_NAME_BOY;
}
