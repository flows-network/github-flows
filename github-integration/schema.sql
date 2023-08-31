CREATE TABLE IF NOT EXISTS listener (
    flows_user text NOT NULL,
    flow_id text NOT NULL,
    github_owner text NOT NULL,
    github_repo text NOT NULL,
    handler_fn text,
    events text[] NOT NULL,
    PRIMARY KEY (flows_user, flow_id, github_owner, github_repo)
);

CREATE TABLE IF NOT EXISTS login_oauthor (
    flows_user text NOT NULL,
    github_login text NOT NULL,
    github_access_token text NOT NULL,
    PRIMARY KEY (flows_user, github_login)
);