export interface User {
    username: string;
    name: string;
    created: Date;
}

export interface Forum {
    name: string;
    description: string;
}

export interface Post {
    title: string;
    content: string;
    created: Date;
    updated: Date;
}

export interface Tag {
    name: string;
    description: string;
}

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
    MANAGES: {
        from: User;
        to: Forum;
        props: {
            since: Date;
        };
    };
    WROTE: {
        from: User;
        to: Post;
        props: Record<string, never>;
    };
    TAGGED: {
        from: Post;
        to: Tag;
        props: {
            weight: number;
        };
    };
    IN: {
        from: Post;
        to: Forum;
        props: Record<string, never>;
    };
}
