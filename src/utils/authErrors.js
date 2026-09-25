const messages = {
  "auth/wrong-password": "كلمة المرور غير صحيحة",
  "auth/user-not-found": "لا يوجد حساب بهذا البريد الإلكتروني",
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "auth/email-already-in-use": "هذا البريد الإلكتروني مستخدم بالفعل",
  "auth/weak-password": "كلمة المرور ضعيفة جدا",
  "auth/invalid-email": "البريد الإلكتروني غير صالح",
  "auth/too-many-requests": "محاولات كثيرة، حاول مرة أخرى لاحقا",
};

export function getAuthErrorMessage(error) {
  return messages[error?.code] || "حدث خطأ، حاول مرة أخرى";
}
