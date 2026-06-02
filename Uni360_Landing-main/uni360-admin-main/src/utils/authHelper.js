export const saveStudentToken = (token) => {
  localStorage.setItem("student_access_token", token);
};

export const getStudentToken = () => {
  return localStorage.getItem("student_access_token");
};
