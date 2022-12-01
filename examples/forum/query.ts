import { DB, convert, driver } from "typed-neo4j";
import { VertexSchema, EdgeSchema } from "./types";

const db = new DB<VertexSchema, EdgeSchema>();

const user = process.argv[2] || "User 1";

(async () => {
    await get_interested_tags(user);
    await get_latest_posts_from_follows(user);
    db.close();
    driver.close();
})();

async function get_interested_tags(user: string) {
    console.time("get_interested_tags");
    const result = await db.run(
        `
        MATCH (:User { name: $name })-[:FOLLOWS]->(:User)-->(:Post)-[:TAGGED]->(t:Tag)
        UNWIND t.name AS tag 
        RETURN tag, count(tag) AS weight 
        ORDER BY weight DESC`,
        { name: user },
    );
    console.log(
        result.records.map((record) => record.toObject()).map((o) => [o.tag, o.weight.toBigInt()]),
    );
    console.timeEnd("get_interested_tags");
}

async function get_latest_posts_from_follows(user: string) {
    console.time("get_latest_posts_from_follows");
    const result = await db.run(
        `
        MATCH (u:User {name: $name})-[:FOLLOWS]->(f:User)-[:WROTE]->(p:Post)
        WITH f, max(p.created) AS latest
        MATCH (f)-[:WROTE]->(p:Post { created: latest })
        RETURN p`,
        { name: user },
    );
    console.log(result.records.map((record) => convert.js(record.get("p").properties)));
    console.timeEnd("get_latest_posts_from_follows");
}
