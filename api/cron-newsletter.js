import { handleVercelNewsletterCron } from "../dist/vercel-handler.js";

export default async function handler(request, response) {
  await handleVercelNewsletterCron(request, response);
}
