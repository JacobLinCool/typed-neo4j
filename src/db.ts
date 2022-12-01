import debug from "debug";
import { Result, Session, Node } from "neo4j-driver";
import { Vertex, EdgeSchema as ES, VertexFrom, VertexTo, EdgeProps } from "./types";
import { driver } from "./driver";
import { convert } from "./convert";

const log = debug("db");

export class DB<
    VertexSchema extends Omit<Record<string, Record<string, unknown>>, string> = Record<
        string,
        Record<string, unknown>
    >,
    EdgeSchema extends Omit<Record<string, ES>, string> = Record<string, ES>,
> {
    private readonly session: Session;

    constructor(database = "neo4j") {
        this.session = driver.session({ database });
    }

    async run(query: string, params?: Record<string, unknown>): Promise<Result> {
        log(query, params);
        const result = await this.session.run(query, params);
        log(result);
        return result;
    }

    async close(): Promise<void> {
        await this.session.close();
    }

    async reset(): Promise<void> {
        await this.run("MATCH (n) DETACH DELETE n");
    }

    async create<T extends Record<string, unknown>, V extends keyof VertexSchema>(
        label: V,
        props: V extends keyof VertexSchema ? VertexSchema[V] | VertexSchema[V][] : T | T[],
    ): Promise<(Vertex & (V extends keyof VertexSchema ? VertexSchema[V] : T))[]> {
        props = convert.neo4j(props);

        const results = await this.run(
            `UNWIND $props AS props CREATE (n:${String(label)}) SET n = props RETURN n`,
            { props: Array.isArray(props) ? props : [props] },
        );

        const items: Node[] = results.records.map((record) => record.get("n"));

        return items.map((item) => ({
            $id: item.elementId,
            ...item.properties,
        })) as (Vertex & (V extends keyof VertexSchema ? VertexSchema[V] : T))[];
    }

    async find<T extends Record<string, unknown>, V extends keyof VertexSchema>(
        label: V,
        props: V extends keyof VertexSchema
            ? Partial<VertexSchema[V]>
            : T = {} as V extends keyof VertexSchema ? Partial<VertexSchema[V]> : T,
        config: {
            limit?: number;
            skip?: number;
            order?: { [key in keyof T]?: "asc" | "desc" };
        } = {},
    ): Promise<(Vertex & (V extends keyof VertexSchema ? VertexSchema[V] : T))[]> {
        const keys = Object.keys(props);
        props = convert.neo4j(props);

        const results = await this.run(
            `MATCH (n:${String(label)} { ${keys
                .map((key) => `${key}: $${key}`)
                .join(", ")} }) RETURN n ${
                config.order
                    ? `ORDER BY ${Object.entries(config.order)
                          .map(([key, order]) => `n.${key} ${order}`)
                          .join(", ")}`
                    : ""
            } ${config.limit ? `LIMIT ${config.limit}` : ""} ${
                config.skip ? `SKIP ${config.skip}` : ""
            }`,
            props,
        );

        const items: Node[] = results.records.map((record) => record.get("n"));

        return items.map((item) => ({
            $id: item.elementId,
            ...item.properties,
        })) as (Vertex & (V extends keyof VertexSchema ? VertexSchema[V] : T))[];
    }

    async fetch<V extends VertexSchema[keyof VertexSchema]>(
        vertex: Vertex & Partial<V>,
    ): Promise<Vertex & V> {
        const result = await this.run(`MATCH (n) WHERE elementId(n) = $id RETURN n`, {
            id: vertex.$id,
        });

        const item = result.records[0].get("n");

        return { $id: item.elementId, ...item.properties };
    }

    async update<V extends VertexSchema[keyof VertexSchema]>(
        vertex: Vertex & V,
        props: V,
    ): Promise<Vertex & V> {
        const keys = Object.keys(props as Record<string, unknown>);
        props = convert.neo4j(props);

        const result = await this.run(
            `MATCH (n) WHERE elementId(n) = $id SET n = { ${keys
                .map((key) => `${key}: $${key}`)
                .join(", ")} } RETURN n`,
            { id: vertex.$id, ...props },
        );

        const item = result.records[0].get("n");

        return { $id: item.elementId, ...item.properties };
    }

    async link<
        T extends Record<string, unknown>,
        E extends keyof EdgeSchema,
        VF extends VertexFrom<EdgeSchema[E]> & Vertex,
        VT extends VertexTo<EdgeSchema[E]> & Vertex,
    >(
        source: VF,
        rel: E,
        targets: VT | VT[],
        props: E extends keyof EdgeSchema
            ? EdgeProps<EdgeSchema[E]>
            : T = {} as E extends keyof EdgeSchema ? EdgeProps<EdgeSchema[E]> : T,
    ): Promise<void> {
        const keys = Object.keys(props || {});
        props = convert.neo4j(props);

        await this.run(
            `UNWIND $targets AS target MATCH (s), (t) WHERE elementId(s) = $source AND elementId(t) = target CREATE (s)-[:${String(
                rel,
            )} { ${keys.map((key) => `${key}: $${key}`).join(", ")} }]->(t)`,
            {
                source: source.$id,
                targets: Array.isArray(targets) ? targets.map((t) => t.$id) : [targets.$id],
                ...props,
            },
        );
    }
}
