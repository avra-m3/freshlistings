import { Redis } from "npm:ioredis@5.6.1";

const redisUrl = Deno.env.get("REDIS_URL") || "redis://localhost:6379";
export const redis_raw = new Redis(redisUrl);
