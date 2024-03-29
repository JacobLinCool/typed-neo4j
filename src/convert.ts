/* eslint-disable @typescript-eslint/no-explicit-any */
import { types } from "neo4j-driver";

export const convert = {
	/** Convert JS types to Neo4j types */
	neo4j: (value: any): any => {
		if (value instanceof Date) {
			return types.DateTime.fromStandardDate(value);
		}
		if (value instanceof BigInt) {
			return types.Integer.fromString(value.toString());
		}
		if (Array.isArray(value)) {
			return value.slice().map(convert.neo4j);
		}
		if (typeof value === "object") {
			const result: Record<string, any> = {};
			for (const key in value) {
				result[key] = convert.neo4j(value[key]);
			}
			return result;
		}
		return value;
	},
	/** Convert Neo4j types to JS types */
	js: (value: any): any => {
		if (value instanceof types.DateTime) {
			return value.toStandardDate();
		}
		if (value instanceof types.Integer) {
			return value.toBigInt();
		}
		if (Array.isArray(value)) {
			return value.slice().map(convert.js);
		}
		if (typeof value === "object") {
			const result: Record<string, any> = {};
			for (const key in value) {
				result[key] = convert.js(value[key]);
			}
			return result;
		}
		return value;
	},
};
