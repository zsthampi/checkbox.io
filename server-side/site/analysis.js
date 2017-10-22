var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var fs = require("fs");

var fileList = [];

function main()
{
	var args = process.argv.slice(2);

	getJsFiles(".");
	var index = fileList.indexOf("./analysis.js");
	if (index > -1) {
		fileList.splice(index, 1);
	}

	console.log(fileList);

	fileList.forEach(function(filePath) {
		complexity(filePath);
	});
}

function getJsFiles(dir) {
	fs.readdirSync(dir).forEach(function(file) {
		var filePath = dir + "/" + file;
		if(fs.statSync(filePath).isDirectory() && filePath.indexOf("node_modules/")==-1) {
			getJsFiles(filePath);
		} else if(!fs.statSync(filePath).isDirectory() && file.endsWith(".js")) {
			fileList.push(filePath);
		}
	});
}

function traverse(object, visitor) 
{
    var key, child;
    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}

function complexity(filePath)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var ast = esprima.parse(buf, options);

	var i = 0;

	// Tranverse program with a function visitor.
	traverseWithParents(ast, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var name = functionName(node);
			var StartLine    = node.loc.start.line;
			var EndLine    = node.loc.end.line;
			var LineCount = EndLine - StartLine;

			if (LineCount > 120) {
				console.log("LONG METHOD : FAILED");
			}

			// Check for Sync calls
			var sync_calls = 0;

			traverseWithParents(node.body, function (child) {
				if(child.type === "CallExpression" && typeof(child.callee.object) === "object" && "type" in child.callee.object && child.callee.object.type === "Identifier" 
				&& child.callee.property.type === "Identifier" && child.callee.property.name.indexOf("Sync") != -1) {
					sync_calls += 1;
				}
			});
			
			if (sync_calls > 1) {
				console.log("SYNC CALLS : FAILED ");
			}

		}

		if("type" in node && (node.type === "CallExpression" || node.type === "MemberExpression")) {
			if (message_chains(node) >= 4) {
				console.log("MESSAGE CHAINS : FAILED ");
			}
		}

		if(node.type === 'ForStatement' || node.type === 'WhileStatement'){
			traverseWithParents(node.body, function(second){
				if(second.type === 'ForStatement' || second.type === 'WhileStatement'){
					traverseWithParents(second.body, function(third){
						if(third.type === 'ForStatement' || third.type === 'WhileStatement'){
							console.log("COMPLEXITY O(3) : FAILED");
						}
					});
				}
			});
		}

	});

}

function message_chains(node) {
	if(node.type.indexOf("Expression") != -1) {
		if ("callee" in node) {
			if (node.callee.type === "Identifier") {
				return 1;
			} else {
				return message_chains(node.callee);
			}
		}
		if ("object" in node) {
			if (node.object.type === "Identifier" && node.property.type === "Identifier") {
				return 2;
			}
			if (node.object.type === "Identifier") {
				return 1;
			} else {
				return message_chains(node.object) + 1;
			}
		}
		return 0;
	}
}

// Helper function for printing out function name.
function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "anon function @" + node.loc.start.line;
}

main();

