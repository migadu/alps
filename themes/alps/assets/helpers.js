(function() {
	var sheet = document.styleSheets[0];
	var addCSSRule = function(selector, rules, index) {
		if ("insertRule" in sheet) {
			sheet.insertRule(selector + "{" + rules + "}", index);
			return;
		}
		if ("addRule" in sheet) {
			sheet.addRule(selector, rules, index);
		}
	};

	var checkboxAll = document.getElementById("action-checkbox-all");
	if (checkboxAll) {
		addCSSRule(".message-list-checkbox", "display: table-cell !important;");
		checkboxAll.addEventListener("click", function(ev) {
			var allChecked = this.checked;
			var inputs = document.querySelectorAll("tr .message-list-checkbox input");
			Array.prototype.slice.apply().forEach(function(cb) {
				cb.checked = allChecked;
			});
		});
	}
})();
