import neo4j from "neo4j-driver";
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from "./config";

export const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

function exit() {
    driver.close();
    process.exit();
}

process.on("exit", exit);
process.on("SIGINT", exit);
process.on("SIGUSR1", exit);
process.on("SIGUSR2", exit);
process.on("uncaughtException", (err) => {
    console.error(err);
    exit();
});
