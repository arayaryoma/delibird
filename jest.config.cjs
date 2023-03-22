module.exports = {
	transform: {
		"^.+\\.m?(t|j)sx?$": ["@swc/jest"],
	},

	globalSetup: "./tests/global-setup.mjs",
	testPathIgnorePatterns: ["/node_modules/"],
	testURL: "https://smee.io/CHANNEL",
	testMatch: [
		"**/__tests__/**/*.?(m)[jt]s?(x)",
		"**/?(*.)+(spec|test).?(m)[jt]s?(x)",
	],
};
