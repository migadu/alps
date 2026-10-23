package alpsbase

import (
	"go/ast"
	"go/parser"
	"go/token"
	"path/filepath"
	"sort"
	"strings"
	"testing"
)

// Every handler in this package is reachable. A handler that nothing reaches
// never runs, so no request and no test exercises it, and it drifts from the
// routed handlers beside it. handleDisable did: it overwrote the whole WebAuthn
// record with an empty one, where removing the last security key edits the
// record and asks for the password first.
//
// What is checked is the name: a handle* function passes when its name
// appears anywhere outside its own body, as it does in a route or a call.
func TestEveryHandlerIsReachable(t *testing.T) {
	files, err := filepath.Glob("*.go")
	if err != nil {
		t.Fatal(err)
	}
	fset := token.NewFileSet()
	declared := map[string]bool{}
	referenced := map[string]bool{}
	for _, name := range files {
		if strings.HasSuffix(name, "_test.go") {
			continue
		}
		file, err := parser.ParseFile(fset, name, nil, 0)
		if err != nil {
			t.Fatal(err)
		}
		for _, decl := range file.Decls {
			// A function's own name is not a reference to it, and neither is
			// a call from inside it: a handler is not reached by calling itself.
			var node ast.Node = decl
			self := ""
			if fn, ok := decl.(*ast.FuncDecl); ok {
				if fn.Recv == nil && strings.HasPrefix(fn.Name.Name, "handle") {
					declared[fn.Name.Name] = true
					self = fn.Name.Name
				}
				if fn.Body == nil {
					continue
				}
				node = fn.Body
			}
			ast.Inspect(node, func(n ast.Node) bool {
				if id, ok := n.(*ast.Ident); ok && id.Name != self {
					referenced[id.Name] = true
				}
				return true
			})
		}
	}

	if len(declared) == 0 {
		t.Fatal("found no handle* functions; is the test running in the package directory?")
	}

	var unreached []string
	for name := range declared {
		if !referenced[name] {
			unreached = append(unreached, name)
		}
	}
	sort.Strings(unreached)
	if len(unreached) > 0 {
		t.Errorf("no route or caller reaches %s; route or delete each", strings.Join(unreached, ", "))
	}
}
