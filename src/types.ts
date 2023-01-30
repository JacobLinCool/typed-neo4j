export interface Vertex {
	/** The unique identifier of this vertex (node) */
	$id: string;
}

export interface Edge {
	/** The unique identifier of this edge (relationship) */
	$id: string;
}

export type EdgeSchema<
	VF extends Omit<Vertex, "$id"> = Omit<Vertex, "$id">,
	VT extends Omit<Vertex, "$id"> = Omit<Vertex, "$id">,
	P extends Record<string, unknown> = Record<string, unknown>,
> = {
	from: VF;
	to: VT;
	props?: P;
};

export type VertexFrom<ES> = ES extends EdgeSchema ? ES["from"] : never;
export type VertexTo<ES> = ES extends EdgeSchema ? ES["to"] : never;
export type EdgeProps<ES> = ES extends EdgeSchema ? ES["props"] : never;
