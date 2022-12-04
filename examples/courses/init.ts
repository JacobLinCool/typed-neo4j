import ora from "ora";
import fetch from "node-fetch";
import { PackedEntity, verify } from "course-pack";
import { DB, driver, Vertex } from "typed-neo4j";
import { VertexSchema, EdgeSchema, Provider, Teacher, Program, Course } from "./types";
import { unique } from "./utils";

const url =
    "https://github.com/JacobLinCool/NTNU-Course-Crawler/releases/download/20221106/108-1.108-2.109-1.109-2.110-1.110-2.111-1.json";

main();

async function main() {
    const spinner = ora();
    const db = new DB<VertexSchema, EdgeSchema>();

    spinner.start("Resetting database");
    await db.reset();
    spinner.succeed("Database reset");

    spinner.start("Downloading course pack");
    const raw = await fetch(url).then((res) => res.json());
    spinner.succeed("Course pack downloaded");

    spinner.start("Verifying course pack");
    const pack = verify(raw);
    spinner.succeed("Course pack verified");

    spinner.start("Creating teachers");
    const teachers = await db.create(
        "Teacher",
        unique(pack.teachers, "name").map(({ name }) => ({ name })),
    );
    const teacher_map = new Map(
        pack.teachers.map((t) => [t.id, teachers.find((v) => v.name === t.name)]),
    );
    spinner.succeed("Teachers created");

    spinner.start("Creating programs");
    const programs = await db.create(
        "Program",
        unique(pack.programs, "name").map(({ name }) => ({ name })),
    );
    const program_map = new Map(pack.programs.map(({ id }, i) => [id, programs[i]]));
    spinner.succeed("programs created");

    spinner.start("Creating providers");
    const providers: (Vertex & Provider)[] = [];
    const provider_map = new Map<string, Vertex & Provider>();
    const course_map = new Map<string, Vertex & Course>();
    const dummy: PackedEntity = { name: "Provider Root", children: pack.entities, courses: [] };
    providers.push(...(await db.create("Provider", { name: dummy.name })));
    provider_map.set(dummy.name, providers[0]);
    const queue = [dummy];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node) {
            const vertex = provider_map.get(node.name);
            const children = await db.create(
                "Provider",
                node.children.map((child) => ({ name: child.name })),
            );
            for (const child of children) {
                providers.push(child);
                provider_map.set(child.name, child);
                if (vertex) {
                    await db.link(child, "UNDER", vertex);
                }
            }

            const siblings = new Set<string>();
            const new_courses = await db.create(
                "Course",
                node.courses
                    .filter((course) => {
                        if (siblings.has(course.name)) {
                            return false;
                        }
                        siblings.add(course.name);
                        return !course_map.has(course.code);
                    })
                    .map((course) => ({
                        ...course,
                        teachers: undefined,
                        programs: undefined,
                        prerequisites: undefined,
                        extra: undefined,
                        year: undefined,
                        term: undefined,
                        id: undefined,
                    })),
            );
            for (const course of new_courses) {
                course_map.set(course.code, course);
            }

            const courses = node.courses
                .map((course) => course_map.get(course.code))
                .filter((course): course is Vertex & Course => course !== undefined);

            if (vertex) {
                await db.link(vertex, "PROVIDES", new_courses);
            }
            for (const c of new_courses) {
                const p = node.courses
                    .find((course) => course.code === c.code)
                    ?.programs.map((id) => program_map.get(id))
                    .filter((p): p is Vertex & Program => p !== undefined);
                if (p) {
                    await db.link(c, "IN", p);
                }
            }

            for (let i = 0; i < courses.length; i++) {
                const t = node.courses[i].teachers.map((name) => teacher_map.get(name)) as (Vertex &
                    Teacher)[];
                await db.link(t, "TEACHES", courses[i], {
                    year: node.courses[i].year,
                    term: node.courses[i].term,
                });
            }

            queue.push(...node.children);
        }

        spinner.text = `Pending Queue: ${queue.length}`;
    }
    spinner.succeed("Providers created");

    db.close();
    driver.close();
}
