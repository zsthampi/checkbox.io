var random = require("random-js")();

// Assign passed or failed randomly
if (random.integer(1,100) < 50) {
	console.log('PASSED');
} else {
	console.log('FAILED');
}
