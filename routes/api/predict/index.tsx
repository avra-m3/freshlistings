import {Handlers, RouteConfig} from "$fresh/server.ts";
import {z} from "npm:zod@4.0.5";
import {breakdownQuery} from "../../../lib/queryUnderstanding.ts";
import {AllowedModelSchema} from "../../../lib/models.ts";
import {InferredFilters} from "../../../lib/types.ts";

type Data = {
    query?: string;
    model?: string;
    understoodQuery?: InferredFilters;
    feedback?: string;
};

const params = z.object({
    q: z.string().max(1000).optional(),
    m: AllowedModelSchema.default("gemini-2.5-flash"),
});

export const config: RouteConfig = {
    skipAppWrapper: true,
    skipInheritedLayouts: true,
};

export const handler: Handlers<Data> = {
    async GET(req, ctx) {
        const url = new URL(req.url);
        const rawParams = Object.fromEntries(url.searchParams.entries());
        const parsedParams = params.safeParse(rawParams);
        if (!parsedParams.success) {
            return new Response(JSON.stringify({
                feedback: "Invalid query parameters",
            }), {
                headers: { "Content-Type": "application/json" },
            });
        }
        const q = parsedParams.data.q;
        const m = parsedParams.data.m;
        if (q) {
            const understoodQuery = await breakdownQuery(q, m);
            if(!understoodQuery) {
                return new Response(JSON.stringify({
                    query: q,
                    model: m
                }), {
                    headers: { "Content-Type": "application/json" },
                });
            }
            console.log("query", understoodQuery);
            return new Response(JSON.stringify({
                query: q,
                understoodQuery,
                model: m,
            }), {
                headers: { "Content-Type": "application/json" },
            });
        }
        if (!parsedParams.success) {
            return new Response(JSON.stringify({
                feedback: "Start your property journey with a question.",
            }), {
                headers: { "Content-Type": "application/json" },
            });
        }
        return ctx.render({ feedback: "No query provided", query: q, model: m });
    },
};

// export default function Search({ data }: PageProps<Data>) {
//     if(!data.understoodQuery){
//         return <div></div>
//     }
//     return (
//         <FilterPanel filters={data.understoodQuery} />
//     );
// }
