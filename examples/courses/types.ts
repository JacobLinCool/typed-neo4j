export interface Provider {
	name: string;
}

export interface Teacher {
	name: string;
}

export interface Program {
	name: string;
}

export interface Course {
	name: string;
	description: string;
	code: string;
	type: string;
	credit: number;
}

export interface VertexSchema {
	Provider: Provider;
	Teacher: Teacher;
	Program: Program;
	Course: Course;
}

export interface EdgeSchema {
	TEACHES: {
		from: Teacher;
		to: Course;
		props: {
			year: number;
			term: number;
		};
	};
	PROVIDES: {
		from: Provider;
		to: Course;
		props: Record<string, never>;
	};
	IN: {
		from: Course;
		to: Program;
		props: Record<string, never>;
	};
	UNDER: {
		from: Provider;
		to: Provider;
		props: Record<string, never>;
	};
	PREREQUISITE: {
		from: Course;
		to: Course;
		props: Record<string, never>;
	};
}
