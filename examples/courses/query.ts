import { DB, driver } from "typed-neo4j";
import { VertexSchema, EdgeSchema, Course, Provider, Teacher } from "./types";

const db = new DB<VertexSchema, EdgeSchema>();

const provider = process.argv[2] || "資工系";

(async () => {
	await get_courses_under(provider);
	db.close();
	driver.close();
})();

async function get_courses_under(provider: string) {
	const start = process.hrtime();
	const result = await db.query<{ c: Course; p: Provider; t: Teacher[] }>(
		`
        MATCH (:Provider { name: $provider })<-[:UNDER *0..5]-(p:Provider)-[:PROVIDES]->(c:Course)<-[:TEACHES]-(t:Teacher)
        RETURN c, p, COLLECT(t.name) AS t`,
		{ provider },
	);
	const end = process.hrtime(start);
	console.log(result.map((r) => ({ ...r.c, provider: r.p, teachers: r.t })));
	console.log(result.length);
	console.log(`Query took ${end[0] + end[1] / 1e6} ms`);
}
