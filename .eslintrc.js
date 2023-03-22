module.exports = {
    env: {
        es2022: true,
        node: true,
    },
    extends: ["eslint:recommended", "prettier"],
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
};
