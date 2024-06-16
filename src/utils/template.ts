import { TEMPLATE_KEY } from "@/constants";

function getKey(template: TEMPLATE_KEY): string {
  return `TEMPLATE_${template}`;
}

export async function loadTemplate(template: TEMPLATE_KEY): Promise<string> {
  const key = getKey(template);
  let result = localStorage.getItem(key);
  if (!result) {
    const res = await fetch(`/templates/${template}`);
    result = await res.text();
    localStorage.setItem(key, result);
  }
  return result;
}
