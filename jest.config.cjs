module.exports = {
	transform: {
		"^.+\\.(t|j)sx?$": ["@swc/jest"],
	},
	globalSetup: "./tests/global-setup.js",
	testPathIgnorePatterns: [
		"/node_modules/"
	],
};
