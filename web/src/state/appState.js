const COMPANY_KEY = "companyId";
const COMP_KEY = "competenceMonth"; // "YYYY-MM"

export function getCompanyId() {
  return localStorage.getItem(COMPANY_KEY) || "";
}
export function setCompanyId(id) {
  localStorage.setItem(COMPANY_KEY, id || "");
}

export function getCompetenceMonth() {
  return localStorage.getItem(COMP_KEY) || new Date().toISOString().slice(0, 7);
}
export function setCompetenceMonth(v) {
  localStorage.setItem(COMP_KEY, v);
}