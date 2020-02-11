-- This message will be printed when the plugin is loaded
print("Hi, this is an example Lua plugin")

-- Setup a function called when the mailbox view is rendered
koushin.on_render("mailbox.html", function(data)
	print("The mailbox view for " .. data.Mailbox.Name .. " is being rendered")
	-- Set extra data that can be accessed from the mailbox.html template
	data.Extra.Example = "Hi from Lua"
end)

-- Wire up a new route
koushin.set_route("GET", "/example", function(ctx)
	ctx:String(200, "This is an example page.")
end)

-- Set a filter function that can be used from templates
koushin.set_filter("example_and", function(a, b)
    return a .. " and " .. b
end)
