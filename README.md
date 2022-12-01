# Typed Neo4j

Neo4j driver with customizable schema for vertex and edge.

## Example

You should define your schema first.

```ts
export interface User {
    username: string;
    name: string;
    created: Date;
}

export interface Post {
    title: string;
    content: string;
    created: Date;
    updated: Date;
}

/** Other Vertex Schema ... */

export interface VertexSchema {
    User: User;
    Tag: Tag;
    Post: Post;
    Forum: Forum;
}

export interface EdgeSchema {
    FOLLOWS: {
        from: User;
        to: User;
        props: {
            since: Date;
        };
    };
    /** Other Edge Schema ... */
}
```

Then you can use it to create a db session.

```ts
const db = new DB<VertexSchema, EdgeSchema>();
```

Enjoy your typed `db.create`, `db.find`, `db.update`, `db.link`!

Please see [example](example) for more details.
