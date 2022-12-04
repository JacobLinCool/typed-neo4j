import { DB, convert, driver } from "typed-neo4j";
import { VertexSchema, EdgeSchema } from "./types";

const db = new DB<VertexSchema, EdgeSchema>();

const provider = process.argv[2] || "資工系";

(async () => {
    await get_courses_under(provider);
    db.close();
    driver.close();
})();

async function get_courses_under(provider: string) {
    console.time("get_courses_under");
    const result = await db.run(
        `
        MATCH (:Provider { name: $provider })<-[:UNDER *0..5]-(p:Provider)-[:PROVIDES]->(c:Course)
        RETURN c`,
        { provider },
    );
    console.log(result.records.map((record) => convert.js(record.get("c").properties)));
    console.timeEnd("get_courses_under");
}
