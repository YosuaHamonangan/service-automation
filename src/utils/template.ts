import { TEMPLATE_KEY } from "@/constants";

export async function loadTemplate(template: TEMPLATE_KEY): Promise<string> {
  const res = await fetch(`/templates/${template}`);
  const result = await res.text();
  return result;
}
