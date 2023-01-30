import ora from "ora";
import { DB } from "typed-neo4j";
import { VertexSchema, EdgeSchema } from "./types";

const USER_COUNT = 100;
const TAG_COUNT = 30;
const EACH_POST_COUNT = [0, 30] as [number, number];
const EACH_TAG_COUNT = [0, 5] as [number, number];
const EACH_FOLLOW_COUNT = [0, 10] as [number, number];

function random(range: [number, number]): number {
	return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
}

const user_names = Array.from({ length: USER_COUNT }, (_, i) => `User ${i + 1}`);
const tag_names = Array.from({ length: TAG_COUNT }, (_, i) => `Tag ${i + 1}`);

main();

async function main() {
	const spinner = ora();
	const db = new DB<VertexSchema, EdgeSchema>();

	spinner.start("Resetting database");
	await db.reset();
	spinner.succeed("Database reset");

	spinner.start("Creating users");
	const users = await db.create(
		"User",
		user_names.map((name) => ({
			username: name.toLowerCase().replace(" ", "_"),
			name,
			created: new Date(),
		})),
	);
	spinner.succeed(`Created ${USER_COUNT} users`);

	spinner.start("Creating tags");
	const tags = await db.create(
		"Tag",
		tag_names.map((name) => ({ name, description: "" })),
	);
	spinner.succeed(`Created ${TAG_COUNT} tags`);

	const main_forum = await db.create("Forum", {
		name: "Homeland",
		description: "The main forum.",
	});
	await db.link(users[0], "MANAGES", main_forum, { since: new Date() });

	spinner.start("Creating posts and follows");
	for (const user of users) {
		const post_count = random(EACH_POST_COUNT);

		const posts = await db.create(
			"Post",
			Array.from({ length: post_count }, (_, i) => ({
				title: `Post ${i} by ${user.name}`,
				content: `This is a post by ${user.name}`,
				created: new Date(Date.now() + i),
				updated: new Date(Date.now() + i),
			})),
		);

		await db.link(user, "WROTE", posts);

		for (const post of posts) {
			const selected_tags = tags
				.sort(() => Math.random() - 0.5)
				.slice(0, random(EACH_TAG_COUNT));

			await db.link(post, "TAGGED", selected_tags, { weight: random([0, 5]) });
			await db.link(post, "IN", main_forum);
		}

		const follows = users
			.filter(({ $id }) => $id !== user.$id)
			.sort(() => Math.random() - 0.5)
			.slice(0, random(EACH_FOLLOW_COUNT));

		await db.link(user, "FOLLOWS", follows, { since: new Date() });

		spinner.text = `Creating posts and follows: ${users.indexOf(user) + 1}/${USER_COUNT}`;
	}
	spinner.succeed("Created posts and follows");

	spinner.succeed("Database initialized");
	process.exit();
}
