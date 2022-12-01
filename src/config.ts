import { config } from "dotenv";

config();

export const NEO4J_URI = process.env.NEO4J_URI || "neo4j://localhost:7687";
export const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
export const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "neo4j";
